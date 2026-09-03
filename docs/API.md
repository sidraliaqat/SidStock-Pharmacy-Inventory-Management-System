# SidStock API Documentation

Base URL (local development): `http://localhost:5000/api`

All responses use a consistent envelope:

```json
// Success
{ "success": true, "message": "...", "data": { } }

// Error
{ "success": false, "message": "...", "errors": ["optional", "list", "of", "field", "errors"] }
```

## Table of Contents
1. [Authentication](#authentication)
2. [Authorization / Roles](#authorization--roles)
3. [Medicines](#medicines)
4. [Categories](#categories)
5. [Suppliers](#suppliers)
6. [Inventory](#inventory)
7. [Users](#users)
8. [Dashboard](#dashboard)
9. [Error Responses](#error-responses)

---

## Authentication

All endpoints except `POST /auth/register` and `POST /auth/login` require a JWT sent as:

```
Authorization: Bearer <token>
```

### `POST /api/auth/register`
Public self-registration. Always creates a **staff** account — the public cannot choose the `admin` role. Email must be a `@gmail.com` address (enforced by Joi *and* a PostgreSQL `CHECK` constraint on `users.email`).

Request body:
```json
{ "name": "Jane Doe", "email": "jane@pharmacy.local", "password": "Passw0rd1" }
```
`201 Created` → `{ data: { user, token } }`

### `POST /api/auth/login`
```json
{ "email": "admin@pharmacy.local", "password": "Admin@12345" }
```
`200 OK` → `{ data: { user, token } }`

### `GET /api/auth/me`
Returns the authenticated user's profile. Requires `Authorization` header.

### `PUT /api/auth/me`
Update the authenticated user's own name and/or password.
```json
{ "name": "New Name", "password": "NewPassw0rd1" }
```

---

## Authorization / Roles

Two roles: `admin` and `staff`. Enforced **server-side** by two middlewares chained on every protected route:

1. `authenticate` — verifies the JWT, loads the live user from PostgreSQL (so deactivated accounts are rejected even with a valid token).
2. `requireRole('admin')` — 403s any role not in the allow-list.

| Capability | Admin | Staff |
|---|---|---|
| View medicines, search/filter/sort/paginate | ✅ | ✅ |
| Create / edit medicines | ✅ | ❌ |
| Delete medicines | ✅ | ❌ |
| Stock IN / Stock OUT | ✅ | ✅ |
| View inventory history | ✅ | ✅ |
| Manage categories / suppliers | ✅ | ❌ (read-only) |
| Manage users | ✅ | ❌ |
| Export CSV | ✅ | ❌ |
| View dashboard | ✅ (full) | ✅ (scoped) |

---

## Medicines

### `GET /api/medicines`
Server-side search, filter, sort and pagination — combinable in a single request.

| Query param | Type | Description |
|---|---|---|
| `search` | string | Matches `name`, `generic_name`, `sku`, or any batch's `batch_number` |
| `category` | int | Category id |
| `supplier` | int | Supplier id |
| `minPrice` / `maxPrice` | number | Price range |
| `stockStatus` | `in-stock` \| `low` \| `out` | Computed from `quantity` vs `minimum_stock` |
| `expiryStatus` | `ok` \| `expiring-soon` \| `expired` | Computed from the nearest batch expiry date (60-day window) |
| `sort` | string | One of `name`, `price`, `quantity`, `created_at`, `expiry_date`, prefixed with `-` for descending. Whitelisted server-side — arbitrary values are rejected. |
| `page` / `limit` | int | Pagination (`limit` max 100) |

Example:
```
GET /api/medicines?search=panadol&category=1&supplier=2&minPrice=100&maxPrice=500&sort=-price&page=1&limit=20
```

Response:
```json
{
  "success": true,
  "message": "Medicines fetched successfully.",
  "data": [ { "id": 1, "name": "Panadol", "...": "...", "stock_status": "IN STOCK", "expiry_status": "OK" } ],
  "pagination": { "page": 1, "limit": 6, "total": 250, "totalPages": 13 }
}
```

`stock_status` and `expiry_status` are **computed on every request**, never stored.

### `GET /api/medicines/:id`
Returns one medicine including its nearest batch's expiry/batch number/purchase price.

### `POST /api/medicines` *(admin only, `multipart/form-data`)*
Creates a medicine, optionally its first batch, and (if opening quantity > 0) an initial `IN` inventory-history entry — all in one PostgreSQL transaction.

| Field | Required | Notes |
|---|---|---|
| `name` | ✅ | |
| `generic_name` | | |
| `sku` | ✅ | Must be unique |
| `description` | | |
| `category_id` | ✅ | Must reference an existing category |
| `supplier_id` | ✅ | Must reference an existing supplier |
| `price` | ✅ | > 0 |
| `quantity` | | Opening stock, ≥ 0, default 0 |
| `minimum_stock` | | ≥ 0, default 10 |
| `batch_number`, `purchase_price`, `expiry_date` | | Optional opening batch |
| `image` | | `.jpg` / `.jpeg` / `.png` / `.webp`, max 5MB |

### `PUT /api/medicines/:id` *(admin only, `multipart/form-data`)*
Updates editable fields (`name`, `generic_name`, `sku`, `description`, `category_id`, `supplier_id`, `price`, `minimum_stock`, `image`). Quantity is **not** editable here — it can only change through `/api/inventory/:id/in` or `/out`, which log history.

### `DELETE /api/medicines/:id` *(admin only)*
Soft-deletes (`is_deleted = true`), so inventory history referencing the medicine is preserved. Soft-deleted medicines never appear in listings.

### `GET /api/medicines/low-stock` / `/out-of-stock` / `/expired` / `/expiring-soon`
Each returns the live-computed list for that condition, straight from PostgreSQL — no hardcoded logic.

### `GET /api/medicines/export` *(admin only)*
Streams a CSV file (`Content-Disposition: attachment`) honoring the same filters as `GET /api/medicines` (except pagination). Columns: Medicine Name, Generic Name, SKU, Category, Supplier, Price, Quantity, Minimum Stock, Batch Number, Expiry Date, Status.

---

## Categories

| Method | Path | Access |
|---|---|---|
| GET | `/api/categories?search=` | any authenticated user |
| GET | `/api/categories/:id` | any authenticated user |
| POST | `/api/categories` | admin |
| PUT | `/api/categories/:id` | admin |
| DELETE | `/api/categories/:id` | admin — **blocked with 409** if any medicine still references the category |

List responses include `medicine_count` per category (computed via `LEFT JOIN` + `COUNT`).

## Suppliers

Same shape as Categories, plus `email`, `phone`, `address` fields. Delete is likewise blocked (409) while medicines still reference the supplier.

---

## Inventory

### `POST /api/inventory/:medicineId/in`
```json
{ "quantity": 50, "reason": "New Shipment", "batch_number": "PAN-24B", "purchase_price": 95, "expiry_date": "2028-01-01" }
```
Runs inside a PostgreSQL transaction with `SELECT ... FOR UPDATE` row locking:
`BEGIN → lock medicine row → quantity += N → upsert batch (optional) → insert inventory_history → COMMIT`. Any failure rolls back the entire operation.

### `POST /api/inventory/:medicineId/out`
```json
{ "quantity": 20, "reason": "Sale" }
```
Same transactional pattern, but first verifies `quantity <= current_stock`. If insufficient, the whole transaction rolls back and the API returns `422` — **stock can never go negative**.

### `GET /api/inventory/history`
Filters: `medicine`, `type` (`IN`/`OUT`), `user`, `from`, `to` (dates), plus `page`/`limit`.

### `GET /api/inventory/history/:medicineId`
Same filters, scoped to one medicine.

---

## Users *(admin only — every route below requires the admin role)*

| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | List all accounts |
| GET | `/api/users/:id` | One account |
| POST | `/api/users` | Create a staff (or admin) account |
| PUT | `/api/users/:id` | Update name/email/role/`is_active`/password |
| DELETE | `/api/users/:id` | Delete an account (you cannot delete or deactivate yourself) |

---

## Dashboard

### `GET /api/dashboard/admin` *(admin only)*
```json
{
  "data": {
    "stats": {
      "total_medicines": 1250, "total_categories": 12, "total_suppliers": 25,
      "total_stock_units": 12500, "low_stock": 32, "out_of_stock": 7,
      "expired": 5, "expiring_soon": 18
    },
    "recentActivity": [ { "medicine_name": "Panadol", "transaction_type": "IN", "...": "..." } ]
  }
}
```
All numbers come from a single aggregate SQL query — nothing is hardcoded.

### `GET /api/dashboard/user`
Scoped subset: `total_medicines`, `total_stock_units`, `low_stock`, `expiring_soon`.

---

## Error Responses

| Status | Meaning |
|---|---|
| 400 | Malformed request (e.g. invalid id format) |
| 401 | Missing/invalid/expired token, or wrong credentials |
| 403 | Authenticated but not permitted (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate SKU/email/category name, or a delete blocked by dependent records) |
| 422 | Validation failure (Joi) or business-rule violation (e.g. insufficient stock) |
| 500 | Unexpected server error — internals are never leaked to the client |

Validation errors include an `errors` array:
```json
{ "success": false, "message": "Validation failed.", "errors": ["price must be greater than 0"] }
```
