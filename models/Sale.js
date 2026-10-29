const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
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
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      min: [0, "Unit price cannot be negative"],
      default: 0,
    },
    totalAmount: {
      type: Number,
      min: [0, "Total amount cannot be negative"],
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);


saleSchema.pre("save", function (next) {
  if (this.unitPrice !== undefined && this.quantity) {
    this.totalAmount = Number((this.unitPrice * this.quantity).toFixed(2));
  }
  next();
});

module.exports = mongoose.model("Sale", saleSchema);
