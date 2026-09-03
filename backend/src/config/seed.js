/* eslint-disable no-console */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool, withTransaction } = require('./db');

const today = new Date();
const daysFromNow = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const CATEGORIES = [
  ['Painkillers', 'Pain relief and analgesic medicines'],
  ['Antibiotics', 'Medicines that fight bacterial infections'],
  ['Vitamins', 'Vitamin and micronutrient supplements'],
  ['Cough & Cold', 'Cough syrups, decongestants and cold remedies'],
  ['Allergy', 'Antihistamines and allergy relief'],
  ['Digestive', 'Antacids, laxatives and digestive aids'],
  ['Skin Care', 'Topical creams, ointments and dermatological products'],
  ['Supplements', 'General health and nutritional supplements'],
];

const SUPPLIERS = [
  ['ABC Pharma', 'contact@abcpharma.com', '+92-300-1112233', 'Industrial Area, Lahore, Pakistan'],
  ['MediCare Distributors', 'sales@medicaredist.com', '+92-321-4445566', 'Blue Area, Islamabad, Pakistan'],
  ['HealthPlus Suppliers', 'info@healthplus.com', '+92-333-7778899', 'Gulshan-e-Iqbal, Karachi, Pakistan'],
];

// name, generic_name, sku, category, supplier, price, quantity, minStock, batchNo, purchasePrice, expiryInDays
const MEDICINES = [
  ['Panadol', 'Paracetamol', 'MED-001', 'Painkillers', 'ABC Pharma', 150, 240, 50, 'PAN-24A', 95, 620],
  ['Brufen', 'Ibuprofen', 'MED-002', 'Painkillers', 'ABC Pharma', 250, 18, 30, 'BRU-11B', 160, 400],
  ['Augmentin', 'Amoxicillin/Clavulanate', 'MED-003', 'Antibiotics', 'MediCare Distributors', 480, 0, 20, 'AUG-07C', 320, 300],
  ['Cetrizine', 'Cetirizine', 'MED-004', 'Allergy', 'HealthPlus Suppliers', 90, 300, 40, 'CET-19D', 55, 500],
  ['Disprin', 'Aspirin', 'MED-005', 'Painkillers', 'ABC Pharma', 60, 12, 25, 'DIS-03E', 35, 12],
  ['Omeprazole', 'Omeprazole', 'MED-006', 'Digestive', 'MediCare Distributors', 220, 85, 30, 'OME-22F', 140, 45],
  ['Flagyl', 'Metronidazole', 'MED-007', 'Antibiotics', 'HealthPlus Suppliers', 180, 60, 20, 'FLA-15G', 110, -10],
  ['Vitamin D3', 'Cholecalciferol', 'MED-008', 'Vitamins', 'MediCare Distributors', 350, 150, 35, 'VTD-31H', 210, 720],
];

const runSeed = async () => {
  console.log('Seeding database...');

  await withTransaction(async (client) => {
    // --- Categories ---
    const categoryIds = {};
    for (const [name, description] of CATEGORIES) {
      const { rows } = await client.query(
        `INSERT INTO categories (name, description) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name`,
        [name, description]
      );
      categoryIds[rows[0].name] = rows[0].id;
    }

    // --- Suppliers ---
    const supplierIds = {};
    for (const [name, email, phone, address] of SUPPLIERS) {
      const existing = await client.query('SELECT id FROM suppliers WHERE name = $1', [name]);
      if (existing.rows.length) {
        supplierIds[name] = existing.rows[0].id;
        continue;
      }
      const { rows } = await client.query(
        `INSERT INTO suppliers (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING id, name`,
        [name, email, phone, address]
      );
      supplierIds[rows[0].name] = rows[0].id;
    }

    // --- Users (admin + staff) ---
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'SidStock.admin@gmail.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
    const adminHash = await bcrypt.hash(adminPassword, 10);

    const adminResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['System Admin', adminEmail, adminHash]
    );
    const adminId = adminResult.rows[0].id;

    const staffHash = await bcrypt.hash('Staff@12345', 10);
    const staffResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'staff')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Sara Khan', 'SidStock.staff@gmail.com', staffHash]
    );
    const staffId = staffResult.rows[0].id;

    // --- Medicines + batches + opening inventory history ---
    for (const [
      name, generic, sku, catName, supName, price, quantity, minStock,
      batchNo, purchasePrice, expiryDays,
    ] of MEDICINES) {
      const medResult = await client.query(
        `INSERT INTO medicines
           (name, generic_name, sku, description, category_id, supplier_id, price, quantity, minimum_stock, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (sku) DO UPDATE SET
           name = EXCLUDED.name, quantity = EXCLUDED.quantity, price = EXCLUDED.price
         RETURNING id`,
        [
          name, generic, sku, `${name} (${generic}) — standard pharmacy stock item.`,
          categoryIds[catName], supplierIds[supName], price, quantity, minStock,
          null,
        ]
      );
      const medicineId = medResult.rows[0].id;

      await client.query(
        `INSERT INTO medicine_batches (medicine_id, batch_number, quantity, purchase_price, expiry_date)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (medicine_id, batch_number) DO NOTHING`,
        [medicineId, batchNo, quantity, purchasePrice, daysFromNow(expiryDays)]
      );

      if (quantity > 0) {
        await client.query(
          `INSERT INTO inventory_history
             (medicine_id, user_id, transaction_type, quantity, previous_quantity, new_quantity, reason)
           VALUES ($1,$2,'IN',$3,0,$3,'Initial stock (seed data)')`,
          [medicineId, adminId, quantity]
        );
      }
    }

    console.log('✔ Categories, suppliers, users, medicines, batches and history seeded.');
    console.log(`  Admin login:  ${adminEmail} / ${adminPassword}`);
    console.log('  Staff login:  SidStock.staff@gmail.com / Staff@12345');
    console.log(`  (admin id=${adminId}, staff id=${staffId})`);
  });
};

runSeed()
  .catch((err) => {
    console.error('✘ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
