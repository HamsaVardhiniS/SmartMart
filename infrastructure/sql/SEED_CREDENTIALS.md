# SmartMart – Seed Data Credentials & Reference

> ⚠️ For **development / testing only**. Change all passwords before production deployment.

---

## 🔐 Login Credentials

### Admin Users (`admin_db.admin_users`)

| Username | Plain Password | Role | Active |
|---|---|---|---|
| `superadmin` | `SmartMart@Admin2026` | Super Admin | ✅ |
| `mgr.downtown` | `SmartMart@Admin2026` | Store Manager | ✅ |
| `mgr.velachery` | `SmartMart@Admin2026` | Store Manager | ✅ |
| `mgr.coimbatore` | `SmartMart@Admin2026` | Store Manager | ✅ |
| `cashier.rajesh` | `SmartMart@Emp2026` | Cashier | ✅ |
| `hr.deepa` | `SmartMart@Emp2026` | HR Manager | ✅ |
| `inv.praveen` | `SmartMart@Emp2026` | Inventory Manager | ✅ |
| `proc.anand` | `SmartMart@Emp2026` | Procurement Officer | ✅ |
| `analyst.nithya` | `SmartMart@Emp2026` | Analyst | ✅ |
| `it.bala` | `SmartMart@Emp2026` | Store Manager | ❌ (inactive) |

### Employee Logins (`hr_db.employees`)

All 8 employees share the same seed password:  
**`SmartMart@Emp2026`**

| employee_id | Name | Email |
|---|---|---|
| 1 | Rajesh Kumar | rajesh.kumar@smartmart.com |
| 2 | Deepa Venkatesh | deepa.venkatesh@smartmart.com |
| 3 | Muthu Krishnan | muthu.krishnan@smartmart.com |
| 4 | Saranya Rajan | saranya.rajan@smartmart.com |
| 5 | Praveen Selvaraj | praveen.selvaraj@smartmart.com |
| 6 | Anand Murugan | anand.murugan@smartmart.com |
| 7 | Nithya Subramanian | nithya.subramanian@smartmart.com |
| 8 | Balamurugan Pillai | bala.pillai@smartmart.com |

---

## 🗃️ Databases Created

| Database | Service Port | Key Tables |
|---|---|---|
| `pos_db` | 4005 | branches, customers, sales_transactions, payments, refunds |
| `hr_db` | 4003 | departments, employees, attendance, payroll, leave |
| `inventory_db` | 4004 | products, product_categories, brands, inventory_batches |
| `procurement_db` | 4006 | suppliers, supplier_orders, supplier_payments |
| `admin_db` | 4001 | roles, permissions, admin_users, audit_logs, system_config |
| `analytics_db` | 4002 | sales_summary_daily, product_sales_summary, payroll_summary |

---

## 🏪 Branches

| branch_id | Name | Location | Active |
|---|---|---|---|
| 1 | SmartMart Downtown | Anna Salai, Chennai | ✅ |
| 2 | SmartMart Velachery | Velachery Main Rd, Chennai | ✅ |
| 3 | SmartMart Coimbatore | Avinashi Rd, Coimbatore | ✅ |
| 4 | SmartMart Madurai | Racecourse Rd, Madurai | ❌ |

---

## 🛒 Products (15 seeded)

| product_id | SKU | Name | Category | MRP |
|---|---|---|---|---|
| 1 | SKU-GR-001 | Aashirvaad Atta 5kg | Groceries | ₹220 |
| 2 | SKU-GR-002 | Fortune Sunflower Oil 1L | Groceries | ₹125 |
| 3 | SKU-GR-003 | MTR Sambar Masala 100g | Groceries | ₹55 |
| 4 | SKU-EL-001 | Samsung Galaxy A35 | Electronics | ₹24,999 |
| 5 | SKU-EL-002 | boAt Rockerz 255 Pro | Electronics | ₹1,299 |
| 6 | SKU-CL-001 | Peter England Formal Shirt | Clothing | ₹1,099 |
| 7 | SKU-CL-002 | W Floral Kurta | Clothing | ₹799 |
| 8 | SKU-HK-001 | Prestige Pressure Cooker 3L | Home & Kitchen | ₹2,499 |
| 9 | SKU-HK-002 | Milton Steel Tiffin Box | Home & Kitchen | ₹399 |
| 10 | SKU-PC-001 | Nivea Body Lotion 200ml | Personal Care | ₹249 |
| 11 | SKU-PC-002 | Dove Shampoo 340ml | Personal Care | ₹239 |
| 12 | SKU-PC-003 | Colgate MaxFresh 200g | Personal Care | ₹79 |
| 13 | SKU-DA-001 | Amul Full Cream Milk 1L | Dairy | ₹65 |
| 14 | SKU-SN-001 | Britannia Good Day 200g | Snacks | ₹30 |
| 15 | SKU-SN-002 | Lay's Classic Salted 52g | Snacks | ₹25 |

---

## 👥 Roles & Permissions

| role_id | Role | Permissions |
|---|---|---|
| 1 | Super Admin | ALL permissions (32 total) |
| 2 | Store Manager | All except admin:delete, users:delete, config:update |
| 3 | Cashier | pos:*, inventory:view |
| 4 | HR Manager | hr:*, reports:*, users:view |
| 5 | Inventory Manager | inventory:*, reports:view, analytics:view |
| 6 | Procurement Officer | procurement:*, inventory:view, reports:view |
| 7 | Analyst | analytics:*, reports:*, :view on all modules |

---

## 🚚 Suppliers (7 seeded)

| supplier_id | Name | Contact | GST No |
|---|---|---|---|
| 1 | Agro Fresh Supplies Pvt Ltd | Ravi Shankar | GST33AAC1234A1Z5 |
| 2 | Spice Garden Traders | Lalitha Devi | GST33AAC5678B2Z3 |
| 3 | TechWorld Distributors | Kiran Rao | GST29AAC9012C3Z1 |
| 4 | Fashion Forward Wholesale | Meera Joshi | GST27AAC3456D4Z9 |
| 5 | Homecraft Suppliers | Arif Shaikh | GST27AAC7890E5Z7 |
| 6 | Beauty Essentials Co. | Sunita Patil | GST29AAC2345F6Z5 |
| 7 | Dairy Direct Pvt Ltd | Srinivas Reddy | GST36AAC6789G7Z3 |

---

## 💳 Sample Sales Transactions

| Invoice | Branch | Customer | Total | Status |
|---|---|---|---|---|
| INV-100001 | Downtown | Arjun Krishnan | ₹1,630 | COMPLETED |
| INV-100002 | Downtown | Priya Sundaram | ₹3,484 | COMPLETED |
| INV-100003 | Velachery | Ramesh Babu | ₹952 | COMPLETED |
| INV-100004 | Velachery | Kavitha Nair | ₹6,072 | COMPLETED |
| INV-100005 | Coimbatore | Suresh Raj | ₹2,277 | COMPLETED |
| INV-100006 | Downtown | Divya Menon | ₹504 | CANCELLED |
| INV-100007 | Coimbatore | Venkat Subramani | ₹8,436 | COMPLETED |
| INV-100008 | Velachery | Anitha Gopal | ₹1,045 | REFUNDED |

---

## 🔧 How to Apply / Re-Seed

### Option A – Automatic (first container start)
The seed file runs automatically via `docker-entrypoint-initdb.d` on a **fresh** postgres volume.

```bash
# Remove existing volume + restart
docker compose down -v
docker compose up -d postgres
```

### Option B – Apply manually to running container
```bash
# Connect to running postgres container
docker exec -it retail-postgres psql -U postgres -f /docker-entrypoint-initdb.d/08_seed.sql

# Or copy file then run
docker cp infrastructure/sql/08_seed.sql retail-postgres:/tmp/08_seed.sql
docker exec -it retail-postgres psql -U postgres -f /tmp/08_seed.sql
```

### Option C – Direct psql (if port 5432 is exposed)
```bash
psql -h localhost -U postgres -f infrastructure/sql/08_seed.sql
```

### Verify data was inserted
```bash
docker exec -it retail-postgres psql -U postgres -d admin_db -c "SELECT username, role_id, is_active FROM admin_users;"
docker exec -it retail-postgres psql -U postgres -d inventory_db -c "SELECT product_id, sku, product_name, mrp FROM products;"
docker exec -it retail-postgres psql -U postgres -d hr_db -c "SELECT employee_id, first_name, last_name, salary FROM employees;"
```
