/**
 * Smoke tests for the Pharmacy Inventory API.
 *
 * Run with: `node --test tests/api.smoke.test.js`
 * (uses Node's built-in test runner + native fetch — no extra dependencies)
 *
 * Prerequisites: the API must be running (npm run dev / npm start) and the
 * database must be migrated + seeded (npm run migrate && npm run seed),
 * since these tests exercise the real HTTP + PostgreSQL stack end-to-end.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';

const json = async (res) => res.json();

let adminToken;
let staffToken;
let createdMedicineId;

test('health check responds', async () => {
  const res = await fetch(`${BASE_URL}/health`);
  assert.equal(res.status, 200);
  const body = await json(res);
  assert.equal(body.success, true);
});

test('admin can log in', async () => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'SidStock.admin@gmail.com', password: 'Admin@12345' }),
  });
  assert.equal(res.status, 200);
  const body = await json(res);
  assert.equal(body.data.user.role, 'admin');
  adminToken = body.data.token;
});

test('staff can log in', async () => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'SidStock.staff@gmail.com', password: 'Staff@12345' }),
  });
  assert.equal(res.status, 200);
  const body = await json(res);
  assert.equal(body.data.user.role, 'staff');
  staffToken = body.data.token;
});

test('unauthenticated request is rejected', async () => {
  const res = await fetch(`${BASE_URL}/medicines`);
  assert.equal(res.status, 401);
});

test('staff cannot delete a medicine (403)', async () => {
  const res = await fetch(`${BASE_URL}/medicines/1`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert.equal(res.status, 403);
});

test('staff cannot manage users (403)', async () => {
  const res = await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert.equal(res.status, 403);
});

test('admin can create a medicine', async () => {
  const form = new URLSearchParams();
  const res = await fetch(`${BASE_URL}/medicines`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Smoke Test Medicine', sku: `SMOKE-${Date.now()}`,
      category_id: 1, supplier_id: 1, price: 42, quantity: 10, minimum_stock: 5,
    }),
  });
  assert.equal(res.status, 201);
  const body = await json(res);
  assert.equal(body.data.quantity, 10);
  createdMedicineId = body.data.id;
});

test('stock IN increases quantity via transaction', async () => {
  const res = await fetch(`${BASE_URL}/inventory/${createdMedicineId}/in`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: 15, reason: 'Smoke test restock' }),
  });
  assert.equal(res.status, 200);
  const body = await json(res);
  assert.equal(body.data.medicine.quantity, 25);
});

test('stock OUT cannot exceed available quantity', async () => {
  const res = await fetch(`${BASE_URL}/inventory/${createdMedicineId}/out`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: 9999, reason: 'Should fail' }),
  });
  assert.equal(res.status, 422);
});

test('pagination + search + sort combine correctly', async () => {
  const res = await fetch(`${BASE_URL}/medicines?search=smoke&sort=-created_at&page=1&limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 200);
  const body = await json(res);
  assert.ok(body.pagination);
  assert.ok(body.data.length >= 1);
});

test('cleanup: admin can delete the smoke test medicine', async () => {
  const res = await fetch(`${BASE_URL}/medicines/${createdMedicineId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 200);
});
