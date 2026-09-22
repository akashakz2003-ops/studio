# studio

Modern, responsive **Studio Financial Management Web App** designed specifically for photo and photostat studios to manage daily sales, operating expenses, interactive rent tracking, monthly financial statements, and executive business analytics.

---

## 📸 Key Features

- **Lock Screen & Password Protection**:
  - Secure startup screen requiring private password / PIN.
  - Setup your own custom password on first run.
  - Touchscreen numpad for mobile/touch monitors + keyboard support.
  - Quick lock button in the top navigation bar.
- **Fast Daily Sales Recording**:
  - **Passport Photos**: Multiples of 4 auto-pricing (4 = ₹200, 8 = ₹400, etc.) and reprint modes with quick-add buttons (+4, +8, +12, +16).
  - **Photostat Copies**: Dynamic per-copy calculation with presets (+10, +25, +50, +100).
  - **Other Services**: Framing, lamination, scanning, and custom items.
  - **Quick Sales Modal**: Add all services in seconds from any page.
- **Interactive Rent Tracking**:
  - Day-by-day rent calendar toggle (Yes/No).
  - Exclude holidays or closed days automatically.
- **Executive Dashboard**:
  - Today's Revenue, Expenses, and Net Profit KPIs.
  - Interactive charts (Recharts) for income distribution and expense breakdown.
  - Automatic business insights generated from actual studio data.
- **Monthly Financial Statements**:
  - Formal Profit & Loss statement breakdown.
  - Printable layout (`Ctrl + P`) with signature lines.
  - CSV export for Excel compatibility.
- **Dynamic Business Settings**:
  - Change passport rates, copy costs, staff salary, rent rate, and electricity directly from the UI without touching code.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts
- **Backend**: Node.js, Express 5
- **Database**: SQLite with `sql.js` (WebAssembly persistence to file, zero native compilation required)

---

## 🚀 Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/akashakz2003-ops/studio.git
cd studio

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Build Frontend

```bash
npm run build
```

### 3. Start the Server

```bash
npm start
```

Open your browser and navigate to:
👉 **http://localhost:5000**
