# InventoryPilot - Node.js Express & MongoDB Atlas Backend

Complete REST API backend for the **InventoryPilot** smart inventory and demand forecasting platform. Built with **Node.js**, **Express**, **MongoDB Atlas (Mongoose)**, and **JWT authentication**.

---

## 📁 Project Architecture

```
InventoryPilot/
├── .env                      # Environment variables (MongoDB Atlas URI, Port, JWT secret)
├── .env.example              # Environment variables template
├── package.json              # Backend dependencies and run scripts
├── server.js                 # Main Express server entry point & static file hosting
│
├── config/
│   └── db.js                 # MongoDB Atlas Mongoose connection & error handler
│
├── models/
│   ├── User.js               # User authentication model (bcrypt hashed)
│   ├── Product.js            # Product inventory model (stock, prices, safety stock)
│   ├── Category.js           # Product category model
│   ├── Sale.js               # Sales transactions model
│   └── Reorder.js            # Supplier reorder tracking model
│
├── controllers/
│   ├── authController.js     # User registration, login, profile
│   ├── productController.js  # Full Product CRUD (Create, Read, Update, Delete)
│   ├── categoryController.js # Category CRUD
│   ├── saleController.js     # Sale recording with automatic stock deduction
│   ├── reorderController.js  # Reorder placement with automatic restocking
│   └── analyticsController.js# Inventory value, low-stock, and profit metrics
│
├── routes/
│   ├── authRoutes.js         # /api/auth endpoints
│   ├── productRoutes.js      # /api/products endpoints
│   ├── categoryRoutes.js     # /api/categories endpoints
│   ├── saleRoutes.js         # /api/sales endpoints
│   ├── reorderRoutes.js      # /api/reorders endpoints
│   └── analyticsRoutes.js    # /api/analytics endpoints
│
├── middleware/
│   ├── authMiddleware.js     # JWT token verification & optional auth
│   └── errorMiddleware.js    # Centralized 404 & error handlers
│
├── scripts/
│   └── seed.js               # Populates database with sample products & categories
│
└── js/
    └── api.js                # Frontend API client library
```

---

## ⚙️ Environment Variables (`.env`)

The `.env` file is located in the root directory:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Port the Express server listens on | `5000` |
| `NODE_ENV` | Application environment | `development` |
| `MONGODB_URI` | MongoDB Atlas SRV connection string | `mongodb+srv://<user>:<pwd>@cluster0.abcde.mongodb.net/inventorypilot` |
| `JWT_SECRET` | Secret key used for signing JWT auth tokens | `inventorypilot_jwt_super_secret_key...` |
| `JWT_EXPIRES_IN` | Expiration time for authentication tokens | `7d` |
| `CLIENT_URL` | Allowed origin for CORS | `*` |

---

## 🍃 Connecting to MongoDB Atlas

1. **Sign in to MongoDB Atlas**: Go to [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Create a Free Cluster** (M0 Sandbox).
3. **Set up Database Access**:
   - Go to **Database Access** -> **Add New Database User**.
   - Choose **Password** authentication, create a username and password (e.g. `inventory_user`).
4. **Set up Network Access**:
   - Go to **Network Access** -> **Add IP Address**.
   - Add `0.0.0.0/0` (Allow access from anywhere for development) or your current IP.
5. **Get Connection String**:
   - Click **Database** -> **Connect** -> **Drivers** (Node.js).
   - Copy the connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.xyz.mongodb.net/?retryWrites=true&w=majority&appName=InventoryPilot
     ```
6. **Update `.env`**:
   - Replace `<username>` and `<password>` with your credentials.
   - Specify database name `/inventorypilot` before the `?`:
     ```env
     MONGODB_URI=mongodb+srv://inventory_user:yourpassword@cluster0.xyz.mongodb.net/inventorypilot?retryWrites=true&w=majority
     ```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Sample Inventory Data (Optional)
Once your MongoDB Atlas URI is added to `.env`:
```bash
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Production Server
```bash
npm start
```

Once running:
- **Web App**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **API Directory**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 📡 REST API & CRUD Operations

### 1. Products CRUD (`/api/products`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/products` | **Create** a new product |
| `GET` | `/api/products` | **Read** all products (supports `?search=`, `?category=`, `?status=`, `?sortBy=`) |
| `GET` | `/api/products/:id` | **Read** single product details |
| `PUT` | `/api/products/:id` | **Update** an existing product |
| `DELETE` | `/api/products/:id` | **Delete** product and related records |

**Sample Create Product Payload (`POST /api/products`):**
```json
{
  "name": "Wireless Ergonomic Mouse",
  "category": "Electronics",
  "costPrice": 18.50,
  "sellingPrice": 39.99,
  "stock": 45,
  "leadTime": 5,
  "safetyStock": 10,
  "dealer": "LogiTech Suppliers Inc."
}
```

---

### 2. Categories CRUD (`/api/categories`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/categories` | **Read** all categories |
| `POST` | `/api/categories` | **Create** a new category |
| `DELETE` | `/api/categories/:id` | **Delete** a category by ID or name |

**Sample Create Category Payload (`POST /api/categories`):**
```json
{
  "name": "Electronics"
}
```

---

### 3. Sales CRUD (`/api/sales`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/sales` | **Create** sale (automatically deducts stock from product) |
| `GET` | `/api/sales` | **Read** all sales (supports `?date=YYYY-MM-DD` and `?productId=`) |
| `GET` | `/api/sales/product/:productId` | **Read** sales history for demand forecasting |
| `DELETE` | `/api/sales/:id` | **Delete** sale (restores stock back to product) |

**Sample Record Sale Payload (`POST /api/sales`):**
```json
{
  "productId": "660c1d2e8f1b2c3d4e5f6789",
  "quantity": 2
}
```

---

### 4. Reorders CRUD (`/api/reorders`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/reorders` | **Create** reorder (automatically increases product stock & updates dealer) |
| `GET` | `/api/reorders` | **Read** all reorder logs |
| `PUT` | `/api/reorders/:id` | **Update** reorder status or notes |
| `DELETE` | `/api/reorders/:id` | **Delete** reorder log |

**Sample Place Reorder Payload (`POST /api/reorders`):**
```json
{
  "productId": "660c1d2e8f1b2c3d4e5f6789",
  "quantity": 25,
  "unitPrice": 17.50,
  "dealer": "LogiTech Suppliers Inc.",
  "expectedDate": "2026-11-05",
  "notes": "Urgent restock for holiday season"
}
```

---

### 5. Authentication (`/api/auth`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Login and receive JWT bearer token |
| `GET` | `/api/auth/me` | Get currently logged in user profile |

---

### 6. Analytics & Dashboard (`/api/analytics`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/analytics/dashboard` | Returns total inventory value, retail potential, low stock count, and sales revenue |
