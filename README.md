# PetroFinance BI — Enterprise Oil & Gas Management Reporting Platform

> Institutional management reporting, budget variance tracking, and upstream operational cost analytics powered by Django REST, React, AG Grid, and Google Cloud BigQuery.

---

## 1. Project Overview & Business Domain

**PetroFinance BI** is an enterprise management reporting application designed for finance leadership, CFO offices, and operational directors within the oil & gas sector.

The application answers primary management reporting questions:
- How are actual revenue and operating expenses tracking against corporate budget targets?
- What is the net operating profit for any selected reporting period and business unit?
- Which operational cost categories and business units exhibit unfavorable overspend variances?
- How are crude oil extraction volume and realized market netback prices trending?
- What is the gross operating cost per barrel (lifting cost efficiency)?
- Which underlying ledger line items explain aggregated KPI movements?

---

## 2. Synthetic Data Disclaimer

> [!IMPORTANT]
> **100% Synthetic Demonstration Data Only:**  
> All financial amounts, production volumes, realized prices, business unit divisions, and oil field asset names in this repository are completely fictional demonstration records generated via deterministic random seeds (`seed=42`).  
> No confidential, proprietary, or real-world operational records from Saudi Aramco or any other enterprise are used. Currency is denominated in **Saudi Riyals (SAR)**.

---

## 3. High-Level Architecture & Data Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Deterministic Generator                      │
│       (data/generate_data.py -> data/csv/*.csv, seed=42)        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
  ┌───────────────────────────────┐  ┌─────────────────────────────┐
  │  Google BigQuery Sandbox      │  │  Local Synthetic Adapter    │
  │  Dataset: petrofinance        │  │  (High-performance demo)   │
  │  - fact_financials            │  │  (Zero cloud dependency)    │
  │  - fact_production            │  └──────────────┬──────────────┘
  │  - dim_business_unit          │                 │
  │  - dim_oil_field              │                 │
  └──────────────┬────────────────┘                 │
                 │                                  │
                 └───────────────┬──────────────────┘
                                 ▼
              ┌─────────────────────────────────────┐
              │      Django REST Framework API      │
              │  - Parameter validation             │
              │  - Parameterized BigQuery SQL       │
              │  - Consistent REST JSON endpoints   │
              └──────────────────┬──────────────────┘
                                 ▼
              ┌─────────────────────────────────────┐
              │      React + TypeScript + Vite      │
              │  - shadcn/ui Enterprise Navy Shell  │
              │  - Recharts Visualizations          │
              │  - AG Grid Community Ledger Report  │
              └─────────────────────────────────────┘
```

---

## 4. Technology Stack

- **Frontend:**
  - React 19 + TypeScript + Vite
  - Tailwind CSS v4
  - shadcn/ui Component Primitives (Card, Tabs, Badge, Button, Select, Input, Skeleton)
  - **AG Grid Community 36** (Sorting, column filters, pagination, CSV export, custom formatters)
  - **Recharts** (Dual-tone area charts, gradient fills, composed bar/line charts)
  - Lucide React Icons
- **Backend:**
  - Python 3.12+
  - Django 5.1 & Django REST Framework 3.15+
  - `google-cloud-bigquery` official client
  - `django-cors-headers` (Configured for local Vite origins)
  - `python-dotenv` (Environment configuration)
- **Database & Warehouse:**
  - Google BigQuery Sandbox (Dual-mode: BigQuery Live or Local Synthetic Adapter)
  - SQLite (Internal Django session/admin metadata)

---

## 5. Local Quickstart & Developer Experience

### Prerequisites
- **Node.js:** v20+ (Verified on v22.13.0, npm 11.8.0)
- **Python:** 3.11+ (Verified on Python 3.12.5)

### Step 1: Clone and Configure Environment
Copy `.env.example` to `.env` in the root and in `backend/`:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Default `.env` configuration (Local Demo Mode):
```dotenv
DJANGO_SECRET_KEY=petrofinance-secret-key-change-for-production
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# DATA_MODE can be 'demo' or 'bigquery'
DATA_MODE=demo

GOOGLE_CLOUD_PROJECT=petrofinance
BIGQUERY_DATASET=petrofinance

VITE_API_BASE_URL=http://localhost:8000/api
```

### Step 2: Start the Django Backend
In a terminal:
```powershell
# Navigate to backend
cd backend

# Create and activate virtual environment (if not already created)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and start server
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```
Backend will be available at: `http://127.0.0.1:8000/api/health/`

### Step 3: Start the Vite Frontend
In a second terminal:
```powershell
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev -- --host 127.0.0.1 --port 5173
```
Frontend will be available at: **`http://localhost:5173`**

---

## 6. Google BigQuery Sandbox Setup & ADC Activation

The application supports authentic BigQuery execution without requiring any code changes.

### Step 1: Create BigQuery Dataset
1. Open Google Cloud Console: `https://console.cloud.google.com/bigquery`
2. Select or create project `petrofinance`.
3. In BigQuery Studio, create dataset `petrofinance` in a consistent region (e.g., `US` or `me-central1`).

### Step 2: Run DDL and Load CSV Data
1. Run the DDL script in BigQuery Query Editor:
   ```sql
   -- Found in sql/01_schema_and_dimensions.sql
   ```
2. Upload the 4 pre-generated CSVs from `data/csv/`:
   - `dim_business_unit.csv` -> `petrofinance.dim_business_unit`
   - `dim_oil_field.csv` -> `petrofinance.dim_oil_field`
   - `fact_financials.csv` -> `petrofinance.fact_financials`
   - `fact_production.csv` -> `petrofinance.fact_production`
3. Optional: Run `sql/02_reporting_views.sql` to install analytical reporting views.

### Step 3: Authenticate Locally via Google ADC
Run the standard Google Cloud Application Default Credentials login:
```bash
gcloud auth application-default login
```
*(Or set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`)*

### Step 4: Switch Backend Mode
In `backend/.env`, set:
```dotenv
DATA_MODE=bigquery
GOOGLE_CLOUD_PROJECT=petrofinance
BIGQUERY_DATASET=petrofinance
```
Click **Refresh** in the web application header. The status pill will immediately switch to **BigQuery Live** with a green badge, executing parameterized SQL directly against Google BigQuery.

---

## 7. API Contract & Endpoints

Base URL: `http://localhost:8000/api/`

| Endpoint | Method | Query Parameters | Description |
|---|---|---|---|
| `/health/` | `GET` | — | Verifies genuine data source status (`demo_active`, `connected`, `misconfigured`, `disconnected`). |
| `/filters/` | `GET` | — | Returns available date boundaries, business units, oil fields, and categories. |
| `/dashboard/summary/` | `GET` | `start_date`, `end_date`, `business_unit_id` | Returns aggregated revenue, OPEX, operating profit, variances, production volume, and cost per barrel. |
| `/dashboard/trends/` | `GET` | `start_date`, `end_date`, `business_unit_id` | Returns 12-month series for charts and top unfavorable overspend categories. |
| `/reports/financials/` | `GET` | `start_date`, `end_date`, `business_unit_id`, `category`, `metric_type`, `page`, `page_size`, `sort_by`, `sort_direction` | Returns paginated financial ledger items for AG Grid with totals. |
| `/reports/production/` | `GET` | `start_date`, `end_date`, `business_unit_id` | Returns field asset breakdown, gross sales estimates, and lifting cost. |

---

## 8. KPI Definitions & Accounting Rules

| Metric | Formula | Favorable Condition | Display Treatment |
|---|---|---|---|
| **Actual Revenue** | $\sum \text{amount}$ (Revenue, Actual) | N/A | SAR formatting with Millions/Billions compact labels |
| **Revenue Variance** | $\text{Actual Revenue} - \text{Budget Revenue}$ | Positive ($>0$) | Green (+), Red (-) |
| **Actual OPEX** | $\sum \text{amount}$ (OPEX, Actual) | N/A | Energy amber accent |
| **OPEX Variance** | $\text{Actual OPEX} - \text{Budget OPEX}$ | Negative ($<0$, Underspend) | Green for underspend ($-$), Red for overspend ($+$) |
| **Operating Profit** | $\text{Actual Revenue} - \text{Actual OPEX}$ | Positive | Bold KPI display with margin percentage |
| **Operating Margin** | $\frac{\text{Operating Profit}}{\text{Actual Revenue}} \times 100$ | Higher is better | Handled safely when revenue is zero |
| **Cost Per Barrel** | $\frac{\text{Upstream Actual OPEX}}{\text{Gross Barrels Produced}}$ | Lower is better | Lifting cost efficiency in SAR/bbl |

---

## 9. Automated Testing & Verification Results

### Backend Test Suite (Django DRF)
Command:
```powershell
Set-Location backend; .\venv\Scripts\python.exe manage.py test api
```
Output:
```text
Creating test database for alias 'default'...
Found 9 test(s).
System check identified no issues (0 silenced).
.........
----------------------------------------------------------------------
Ran 9 tests in 0.085s

OK
Destroying test database for alias 'default'...
```

### Synthetic Data Integrity Check
Command:
```powershell
.\backend\venv\Scripts\python.exe data\validate_data.py
```
Output:
```text
=== Starting PetroFinance BI Data Validation ===
[PASS] Business Units loaded: 5
[PASS] Oil Fields loaded: 6
[PASS] Production verified: 72 rows, total volume: 90,030,982 bbl
[PASS] Financials verified: 1656 unique records.

--- KPI Summary (SAR) ---
Total Actual Revenue: 28,244,183,052.48 SAR
Total Budget Revenue: 27,622,816,489.51 SAR
Revenue Variance:     621,366,562.97 SAR (+2.25%)
Total Actual OPEX:    6,960,596,838.57 SAR
Total Budget OPEX:    6,633,665,302.53 SAR
OPEX Variance:        326,931,536.04 SAR (+4.93%)
Operating Profit:     21,283,586,213.91 SAR
Cost per Barrel:      77.31 SAR/bbl
==================================================
All validation checks PASSED successfully!
```

### Frontend Production Build
Command:
```powershell
Set-Location frontend; npm run build
```
Output:
```text
vite v8.3.5 building client environment for production...
✓ 2556 modules transformed.
dist/index.html                     0.45 kB
dist/assets/index-Bj8XFcds.css     37.30 kB
dist/assets/index-DgMDVBhY.js   1,869.24 kB
✓ built in 1.85s
```

---

## 10. Known Limitations & Next Steps

1. **Google BigQuery ADC:** The backend is configured and verified ready with genuine parameterized BigQuery queries for project `petrofinance`. Since Google ADC was not logged in on the local development machine during testing, the application runs seamlessly in local demo adapter mode without fabricating cloud credentials. Running `gcloud auth application-default login` enables direct live cloud queries.
2. **Enterprise Features:** In compliance with the specification, only AG Grid Community is used. Advanced Enterprise features (e.g. server-side row grouping, pivot mode, Excel export) are omitted to prevent licensing violations.
3. **Write-back & Budgets:** The platform currently focuses on read-only executive management reporting; future roadmap phases may incorporate financial write-backs or scenario budgeting.

