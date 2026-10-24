const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("../config/db");
const Product = require("../models/Product");
const Category = require("../models/Category");
const User = require("../models/User");

const seedData = async () => {
  try {
    await connectDB();

    console.log("🌱 Starting database seeding...");

    // Create or find a demo user
    let user = await User.findOne({ email: "demo@inventorypilot.com" });
    if (!user) {
      user = await User.create({
        name: "Demo Store Owner",
        email: "demo@inventorypilot.com",
        password: "Password123!",
      });
      console.log("👤 Created demo user: demo@inventorypilot.com (Password: Password123!)");
    }

    // Seed Categories
    const sampleCategories = ["Electronics", "Accessories", "Office Supplies", "Peripherals"];
    for (const catName of sampleCategories) {
      const exists = await Category.findOne({ user: user._id, name: catName });
      if (!exists) {
        await Category.create({ user: user._id, name: catName });
      }
    }
    console.log("📁 Seeded categories");

    // Sample Products
    const sampleProducts = [
      {
        name: "Wireless Ergonomic Mouse",
        category: "Peripherals",
        costPrice: 18.5,
        sellingPrice: 39.99,
        stock: 35,
        leadTime: 5,
        safetyStock: 10,
        dealer: "LogiTech Suppliers Inc.",
        image: "",
      },
      {
        name: "Mechanical Gaming Keyboard RGB",
        category: "Peripherals",
        costPrice: 42.0,
        sellingPrice: 89.99,
        stock: 6, // Low stock -> Needs reorder
        leadTime: 7,
        safetyStock: 15,
        dealer: "KeySwitch Global",
        image: "",
      },
      {
        name: "USB-C Multiport Adapter 7-in-1",
        category: "Accessories",
        costPrice: 14.0,
        sellingPrice: 34.5,
        stock: 22,
        leadTime: 4,
        safetyStock: 8,
        dealer: "Anker Distro",
        image: "",
      },
      {
        name: "Active Noise-Cancelling Headphones",
        category: "Electronics",
        costPrice: 65.0,
        sellingPrice: 149.99,
        stock: 4, // Low stock -> Needs reorder
        leadTime: 10,
        safetyStock: 12,
        dealer: "Acoustic Pro Wholesalers",
        image: "",
      },
      {
        name: "Adjustable Aluminum Laptop Stand",
        category: "Office Supplies",
        costPrice: 12.0,
        sellingPrice: 28.0,
        stock: 48,
        leadTime: 3,
        safetyStock: 10,
        dealer: "ErgoDesk Partners",
        image: "",
      },
    ];

    for (const item of sampleProducts) {
      const exists = await Product.findOne({ user: user._id, name: item.name });
      if (!exists) {
        await Product.create({
          ...item,
          user: user._id,
        });
        console.log(`📦 Added product: ${item.name}`);
      }
    }

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

seedData();
