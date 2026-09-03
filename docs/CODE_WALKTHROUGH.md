# SidStock — Full Code Walkthrough

This is a file-by-file, layer-by-layer explanation of the entire codebase: what
each file does, why it exists, and how data flows through the system. Read it
alongside [`README.md`](../README.md) (setup) and [`API.md`](API.md) (endpoint
reference).

---

## 1. The big picture

```
React (browser)  →  Express routes  →  Controllers  →  Services  →  Repositories  →  PostgreSQL
     UI/state         URL + verb        thin, HTTP      business      raw SQL,        source of
                       + middleware      shaping only     rules,       parameterized    truth
                       chain                              transactions
```

Every write request passes through the same pipeline:
**authenticate → authorize (role check) → validate (Joi) → controller → service → repository → SQL**.
No layer skips ahead — controllers never touch SQL, repositories never contain
business rules, and the frontend is never trusted as the security boundary
(every rule it enforces is re-enforced on the server).

---

## 2. Database layer (`backend/src/config/`)

### `schema.sql`
The single source of truth for the schema. Six tables:

- **`users`** — accounts. `role` is constrained to `'admin'|'staff'` via `CHECK`.
  `email` is constrained to `@gmail.com` addresses via `CHECK` (added on your
  request — see §8). `password_hash` stores a Bcrypt hash, never plaintext.
- **`categories`**, **`suppliers`** — lookup tables, each with `is_deleted`
  for soft delete and a `name`/`email` `UNIQUE` constraint.
- **`medicines`** — the "products". Holds `category_id`/`supplier_id`
  *foreign keys only* (no duplicated category/supplier text — that's what
  "normalized" means here: change a category's name once, every medicine
  referencing it sees the update). `CHECK (price > 0)`, `CHECK (quantity >= 0)`,
  `CHECK (minimum_stock >= 0)`.
- **`medicine_batches`** — one medicine can have many batches (different
  expiry dates/purchase prices/batch numbers over time). `UNIQUE(medicine_id, batch_number)`.
- **`inventory_history`** — the audit trail. Every stock change writes one row
  here: `transaction_type IN ('IN','OUT')`, `previous_quantity`, `new_quantity`,
  `quantity` (the delta), who did it (`user_id`), why (`reason`).

**Indexes** exist on every column the app searches/filters/sorts by
(`sku`, `name`, `category_id`, `supplier_id`, `price`, `quantity`, `created_at`,
`medicine_batches.expiry_date`, `inventory_history.medicine_id`/`created_at`/`user_id`)
— this is what keeps queries fast once you have thousands of rows, instead of
PostgreSQL doing a full table scan on every list request.

**Triggers**: a `set_updated_at()` function + trigger on every table with an
`updated_at` column, so that column is always accurate without every UPDATE
statement having to remember to set it manually.

**Soft delete**: `is_deleted BOOLEAN` on `medicines`/`categories`/`suppliers`.
"Deleting" a medicine sets this flag instead of removing the row — so
`inventory_history` rows that reference it (foreign key) stay intact, and the
audit trail is never broken. Every `SELECT` in the repositories filters
`WHERE is_deleted = FALSE`.

### `db.js`
Wraps the `pg` connection pool with three exports:
- `query(text, params)` — a one-off parameterized query.
- `getClient()` — checks out a dedicated client for manual transaction control.
- `withTransaction(callback)` — the important one: runs `BEGIN`, calls your
  callback with a client, `COMMIT`s if it resolves, `ROLLBACK`s if it throws,
  and always releases the client back to the pool. This is *the* primitive
  every stock-mutating operation is built on (see §6).

### `migrate.js` / `seed.js`
`migrate.js` just executes `schema.sql` against `DATABASE_URL`. `seed.js`
inserts realistic categories/suppliers/medicines/batches, an admin + staff
account (Bcrypt-hashed), and opening `inventory_history` rows — wrapped in one
`withTransaction()` call so a failure partway through doesn't leave a half-seeded
database.

---

## 3. Shared building blocks (`backend/src/{constants,utils}/`)

- **`constants/index.js`** — `ROLES`, `STOCK_STATUS`, `EXPIRY_STATUS` labels,
  `EXPIRING_SOON_DAYS = 60`, and — importantly — `MEDICINE_SORT_FIELDS`, a
  **whitelist** mapping the `sort` query param (`name`, `price`, …) to real SQL
  column names. This is how the API supports `?sort=-price` without ever
  string-concatenating user input into a `ORDER BY` clause (which would be a
  SQL-injection vector).
- **`utils/apiResponse.js`** — `success()`/`error()` helpers so every endpoint
  returns the same `{ success, message, data }` / `{ success, message, errors }`
  envelope.
- **`utils/asyncHandler.js`** — wraps an async controller so a thrown error or
  rejected promise is forwarded to Express's error middleware automatically,
  instead of needing `try/catch` in every single controller function.
- **`utils/ApiError.js`** — a small `Error` subclass carrying an HTTP status
  code. Services `throw new ApiError(404, 'Medicine not found.')` and the
  central error handler knows exactly what status/message to send.
- **`utils/jwt.js`** — `signToken()`/`verifyToken()`, thin wrappers over
  `jsonwebtoken`.
- **`utils/csv.js`** — a ~15-line, dependency-free CSV writer with RFC 4180
  escaping (quotes values containing commas/quotes/newlines, doubles internal
  quotes). Avoided pulling in a CSV library for something this small.
- **`utils/stockStatus.js`** — `getStockStatus(quantity, minimumStock)` and
  `getExpiryStatus(nearestExpiryDate)`. **These are never stored in the
  database** — they're computed fresh on every read, so a status is always
  accurate the instant `quantity` or the clock changes, with no risk of a
  stale cached label.

---

## 4. Middleware (`backend/src/middleware/`)

- **`authMiddleware.js`** — reads `Authorization: Bearer <token>`, verifies
  the JWT signature, then **re-loads the user from PostgreSQL** (not just
  trusting the token's payload) and checks `is_active`. This means deactivating
  a user in the Users page takes effect immediately, even if they have an
  unexpired token sitting in their browser.
- **`roleMiddleware.js`** — `requireRole('admin')` — a one-line 403 gate.
  Chained *after* `authenticate` on every admin-only route.
- **`uploadMiddleware.js`** — configures Multer: disk storage into
  `backend/uploads/`, randomized filenames (`Date.now()-random.ext`) so
  uploads never collide or overwrite each other, a file-type whitelist
  (mimetype *and* extension, both checked) and a size cap read from
  `MAX_UPLOAD_SIZE_MB`.
- **`validationMiddleware.js`** — `validate(schema, source)` runs a Joi schema
  against `req.body` (or `req.query`), collects *all* errors (not just the
  first), and forwards a single `422` through the central error handler if
  anything fails.
- **`errorMiddleware.js`** — the single place all errors end up. Maps raw
  PostgreSQL error codes to safe, user-facing messages (`23505` unique
  violation → 409 "already exists", `23503` FK violation → 409 "related
  records exist", `23514` check violation → 422) so the client never sees a
  raw stack trace or SQL error string.

---

## 5. Validators (`backend/src/validators/`)

One Joi schema file per resource (`authValidators`, `medicineValidators`,
`categoryValidators`, `supplierValidators`, `inventoryValidators`,
`userValidators`), plus `patterns.js` holding the shared Gmail regex. Every
`POST`/`PUT` route validates its body (or query params, for list endpoints)
*before* the controller runs — malformed requests never reach the database.

---

## 6. Repositories (`backend/src/repositories/`) — the SQL layer

This is the only layer allowed to write SQL. Every query is parameterized
(`$1, $2, …`), never string-concatenated.

### `medicineRepository.js` — the most complex file in the project
Builds the search/filter/sort/pagination query dynamically but safely:

- `buildWhereClause(filters)` appends a `WHERE` clause piece for each active
  filter (`search`, `category`, `supplier`, price range, `stockStatus`),
  pushing each value as a bound parameter and tracking the `$N` index as it
  goes.
- `expiryStatus` (`expired`/`expiring-soon`/`ok`) can't live in that `WHERE`
  clause because it depends on a computed column — the *nearest batch expiry
  date* — so the base query uses a `LEFT JOIN LATERAL` subquery per medicine
  to fetch that in one pass (no N+1 query per row), and the expiry filter is
  applied as a second predicate wrapped around the whole thing.
- `parseSort(sort)` looks the requested field up in the `MEDICINE_SORT_FIELDS`
  whitelist (§3) — anything not on the list silently falls back to
  `created_at`, so `?sort=anything;DROP TABLE medicines` is just ignored, not
  executed.
- `findAndCount()` runs the data query and a matching `COUNT(*)` query in
  parallel (`Promise.all`) so pagination totals come back in the same
  round-trip as the page of results.
- `findAllForExport()` is the same filter logic without the `LIMIT`/`OFFSET`,
  capped at 5000 rows, used by CSV export.

### `inventoryRepository.js`
`insertHistory()` — a plain parameterized `INSERT`, always called *inside* a
transaction from `inventoryService` (§7), never on its own. `findAndCount()`
supports the history page's filters (medicine/type/user/date range) plus a
`COUNT(*) OVER()` window function to get the total in the same query.

### `categoryRepository.js` / `supplierRepository.js`
`findAll()` does a `LEFT JOIN` + `COUNT(*) FILTER (...)` to return each
category/supplier's live medicine count in the same query the list page needs
— that's the number shown in the "# Medicines" column.

### `dashboardRepository.js`
`getSummaryStats()` is one CTE-based query (`WITH nearest AS (...)`) that
computes all eight dashboard numbers — total medicines, categories, suppliers,
stock units, low stock, out of stock, expired, expiring soon — in a single
round trip to PostgreSQL. Nothing here is hardcoded; every number is a live
`COUNT`/`SUM` against current data.

---

## 7. Services (`backend/src/services/`) — business rules & transactions

### `inventoryService.js` — the transaction logic you specifically asked about
`stockIn()` and `stockOut()` both follow the same shape:

```
withTransaction(async (client) => {
  SELECT quantity FROM medicines WHERE id = $1 FOR UPDATE   // row lock
  // stockOut only: if requested quantity > current quantity → throw ApiError(422)
  UPDATE medicines SET quantity = newQuantity
  INSERT INTO inventory_history (...)
  return { medicine, history }
})
```

`FOR UPDATE` row-locks that specific medicine row for the duration of the
transaction — if two stock changes for the same medicine happen at the same
moment, the second one waits for the first to commit before reading the
quantity, so you can never lose an update to a race condition. If *anything*
in the callback throws (including the "insufficient stock" check), the whole
transaction rolls back — quantity and history can never drift out of sync,
and stock can never go negative.

### `medicineService.js`
`create()` does three things in **one transaction**: insert the medicine,
optionally insert its opening batch, and (if opening quantity > 0) insert an
initial `IN` history row — all-or-nothing. `enrich()` attaches the live
`stock_status`/`expiry_status` to every medicine object before it goes to the
controller. `exportCsv()` shapes rows into the CSV columns and computes an
"overall status" (out-of-stock beats expiry beats low-stock, in that priority
order) for the CSV's Status column.

### `categoryService.js` / `supplierService.js`
`remove()` checks `countMedicines(id)` first — if any non-deleted medicine
still references the category/supplier, it throws a `409` instead of deleting,
so you can never silently orphan a medicine's category.

### `authService.js`
`register()` **always** passes `role: ROLES.STAFF` to the repository —
whatever `role` value a client sends in the request body is simply ignored by
the route (the register Joi schema doesn't even accept a `role` field), so
there's no way for a public sign-up to become an admin.

### `userService.js`
`update()`/`remove()` both guard `Number(id) === Number(actingUserId)` — you
cannot deactivate or delete your own admin account (which would otherwise let
you lock yourself out).

---

## 8. The Gmail constraint (added on request)

Two independent layers, so it holds even if one is somehow bypassed:

1. **Database**: `CHECK (email ~* '^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@gmail\.com$')`
   on `users.email` in `schema.sql`, plus a guarded `DO $$ ... $$` block that
   adds the constraint to an *already-existing* `users` table when you re-run
   `npm run migrate` (it checks `pg_constraint` first so it's safe to run
   repeatedly).
2. **API**: `patterns.js` exports the same regex; `authValidators.js` and
   `userValidators.js` use it on register/login/create-user/update-user, so a
   bad email gets a clean `422 "email must be a valid @gmail.com address"`
   instead of a raw database error bubbling up.

I proved layer 1 is real (not just app logic) by inserting a row directly via
`psql`, bypassing the API entirely — PostgreSQL rejected it.

---

## 9. Controllers & Routes

Controllers (`backend/src/controllers/`) are deliberately thin: parse
`req.params`/`req.body`/`req.query`, call one service method, shape the
response with `success()`. No SQL, no business rules — if a controller is
doing either, that logic belongs one layer down.

Routes (`backend/src/routes/`) chain middleware in order:
`router.use(authenticate)` → `requireRole(...)` (if admin-only) →
`validate(schema)` → controller. One ordering detail worth knowing:
in `medicineRoutes.js`, static paths (`/low-stock`, `/export`, …) are
registered **before** the `/:id` dynamic route — otherwise Express would match
`GET /medicines/low-stock` against `/:id` first and try to look up a medicine
literally named `"low-stock"`.

`app.js` wires it all together: Helmet (security headers), CORS (locked to
`CLIENT_URL`), a global rate limiter on `/api`, static file serving for
`/uploads`, then all the route groups, then `notFound` + `errorHandler` last.
`server.js` does one `SELECT 1` against the database before calling
`app.listen()` — if PostgreSQL isn't reachable, the process exits immediately
with a clear message instead of starting up and failing mysteriously on the
first request.

---

## 10. Frontend — data & state layer

### `services/api.js`
One shared Axios instance. A **request interceptor** attaches
`Authorization: Bearer <token>` from `localStorage` to every outgoing call. A
**response interceptor** watches for `401` responses globally — on any of
them, it clears the stored session and redirects to `/login`, so an expired
token is handled in exactly one place instead of being checked after every API
call throughout the app.

### `services/*Service.js`
One thin file per resource (`medicineService`, `categoryService`, …) — every
component calls these instead of importing Axios directly, so there's exactly
one place that knows the URL shape for each resource.
`medicineService.exportCsv()` is the one with real logic: it requests the CSV
as a `blob`, builds an object URL, and simulates a click on a hidden
`<a download>` to trigger the browser's save dialog.

### `context/AuthContext.jsx`
Holds `user`/`token`/`isAuthenticated`/`isAdmin`. On mount, if a token exists
in `localStorage`, it calls `GET /auth/me` to **re-validate** it against the
server before trusting it — so a token that was valid yesterday but has since
expired doesn't leave the UI in a false "logged in" state until the first API
call fails. `login()`/`register()`/`logout()` all read/write `localStorage`
directly so the session survives a page refresh.

### `context/ToastContext.jsx`
A tiny pub/sub: `toast.success(msg)` / `.error(msg)` / `.info(msg)` push a
message into an array with an auto-generated id; each `Toast` component
self-dismisses after ~3.8s via `setTimeout`, or can be dismissed early by
clicking the ✕.

### `routes/ProtectedRoute.jsx`
Reads `useAuth()`. If still loading the session, shows a spinner. If not
authenticated, redirects to `/login`. If `allowedRoles` is set and the user's
role isn't in it (e.g. staff hitting `/admin/*`), redirects to their own
dashboard. The code comment is explicit that this is a **UX convenience
only** — the real authorization boundary is the backend's `requireRole`
middleware (§4), which is what actually protects the data.

---

## 11. Frontend — routing & layout

`App.jsx` defines the whole route tree: public `/login` & `/register`, then
two `<ProtectedRoute allowedRoles={...}>` blocks wrapping `AdminLayout` and
`UserLayout`, each with their nested pages as child routes. `AdminLayout` and
`UserLayout` are both thin wrappers around one shared `DashboardLayout`
(sidebar + topbar + `<Outlet />` for the current page) — role differences are
handled *inside* `Sidebar`/`Navbar` by reading `useAuth().isAdmin`, so the
layout markup itself isn't duplicated.

---

## 12. Frontend — shared components (`src/components/`)

A few worth calling out specifically:

- **`MedicineTable.jsx`** — renders **two** representations of the same data:
  a `<table>` for desktop (hidden below 720px via CSS) and a stack of
  `.record-card`s for mobile (hidden above that breakpoint) — same props,
  same data, CSS media queries pick which one is visible. Column headers are
  clickable to toggle sort direction.
- **`MedicineForm.jsx`** — one component, two modes (`mode="create"` vs
  `mode="edit"`). Create mode shows the opening-batch fields (batch number,
  purchase price, expiry date, opening quantity); edit mode hides them,
  because quantity can only change through the Inventory page's transactional
  stock IN/OUT (§7) — editing a medicine directly never touches `quantity`.
- **`FilterPanel.jsx` / `SearchBar.jsx` / `SortDropdown.jsx` / `Pagination.jsx`**
  — all controlled components that just call `onChange`/`onPageChange` with
  the new value; the parent page owns the actual filter state and re-fetches.
  `SearchBar` debounces input by 400ms before calling `onChange`, so typing
  doesn't fire an API request on every keystroke. `Pagination`'s
  `buildPageList()` computes a compact `1 … 4 5 [6] 7 8 … 20` page list
  instead of rendering every page number.
- **Shared "View" components** (`MedicineDetailView`, `InventoryView`,
  `InventoryHistoryView`, `ProfileView`) — each holds the *entire* logic for
  that screen once; the actual page files under `pages/admin/` and
  `pages/user/` are ~3-line wrappers passing `basePath="/admin"` or `"/user"`
  and an `isAdmin` flag. This is how admin and staff get the same screens
  without duplicating the fetch/render logic twice.
- **`Modal.jsx` / `ConfirmDialog.jsx`** — `Modal` is the generic overlay
  (click-outside-to-close, Escape-to-close); `ConfirmDialog` is `Modal` with a
  fixed danger-icon + Cancel/Confirm footer, used everywhere something
  destructive needs a confirmation.

---

## 13. Design system (`src/index.css`)

Plain CSS3, no framework. CSS custom properties (`--primary`, `--border`,
`--status-*-bg/fg`, etc.) defined once in `:root` and used everywhere, so the
whole palette can be re-themed by editing one block. `--font-ui` (IBM Plex
Sans) is used for all UI text; `--font-mono` (IBM Plex Mono) is applied via a
`.mono` class specifically to data cells — SKUs, prices, quantities, dates —
because tabular/monospaced figures are genuinely easier to scan and compare in
a table, not for decoration. Responsive rules live at the bottom: the sidebar
becomes an off-canvas drawer below 980px, and tables switch to the card layout
described above below 720px.

---

## 14. Testing (`backend/tests/api.smoke.test.js`)

Uses Node's built-in test runner (`node --test`) and native `fetch` — zero
extra dependencies. It exercises the *running* API end-to-end against a real
database: health check, admin/staff login, a 401 on no token, 403s on
role-restricted routes, creating a medicine, stock IN increasing quantity via
the transaction, stock OUT correctly rejecting an over-large quantity with
422, combined search+sort+pagination, and cleanup. Run it with `npm test`
while the API and PostgreSQL are both running.
