const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Route imports
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const saleRoutes = require("./routes/saleRoutes");
const reorderRoutes = require("./routes/reorderRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// Initialize Express app
const app = express();

// Connect to MongoDB Atlas
connectDB();

// Disable etag caching so API requests always fetch fresh data from MongoDB
app.set("etag", false);

// CORS Middleware
app.use(cors());

// Body Parsing Middleware (increased limit for base64 product photos)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// HTTP Request Logger in development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Serve Frontend Static Files from root directory
app.use(express.static(path.join(__dirname)));

// API Health Check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  res.status(200).json({
    status: "online",
    message: "InventoryPilot Backend API is healthy",
    mongodbAtlas: statusMap[dbStatus] || "Unknown",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/reorders", reorderRoutes);
app.use("/api/analytics", analyticsRoutes);

// API Documentation / Endpoint Index
app.get("/api", (req, res) => {
  res.status(200).json({
    message: "Welcome to InventoryPilot API",
    endpoints: {
      health: "GET /api/health",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
      },
      products: {
        getAll: "GET /api/products",
        getById: "GET /api/products/:id",
        create: "POST /api/products",
        update: "PUT /api/products/:id",
        delete: "DELETE /api/products/:id",
      },
      categories: {
        getAll: "GET /api/categories",
        create: "POST /api/categories",
        delete: "DELETE /api/categories/:id",
      },
      sales: {
        getAll: "GET /api/sales",
        getByProduct: "GET /api/sales/product/:productId",
        record: "POST /api/sales",
        delete: "DELETE /api/sales/:id",
      },
      reorders: {
        getAll: "GET /api/reorders",
        place: "POST /api/reorders",
        updateStatus: "PUT /api/reorders/:id",
        delete: "DELETE /api/reorders/:id",
      },
      analytics: {
        dashboard: "GET /api/analytics/dashboard",
      },
    },
  });
});

// Fallback to serve index.html for root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 404 Handler for undefined API routes
app.use("/api/*", notFound);

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`🚀 InventoryPilot Backend Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📋 API Index:  http://localhost:${PORT}/api`);
  console.log(`🎨 Web App:    http://localhost:${PORT}`);
  console.log("==================================================");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
});

module.exports = app;
