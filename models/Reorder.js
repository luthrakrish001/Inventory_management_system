const mongoose = require("mongoose");

const reorderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
    totalCost: {
      type: Number,
      min: [0, "Total cost cannot be negative"],
      default: 0,
    },
    dealer: {
      type: String,
      trim: true,
      default: "",
    },
    expectedDate: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    placedOn: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Ordered", "Received", "Cancelled"],
      default: "Ordered",
    },
  },
  {
    timestamps: true,
  }
);


reorderSchema.pre("save", function (next) {
  if (this.unitPrice !== undefined && this.quantity) {
    this.totalCost = Number((this.unitPrice * this.quantity).toFixed(2));
  }
  next();
});

module.exports = mongoose.model("Reorder", reorderSchema);
