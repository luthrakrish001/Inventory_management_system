const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [150, "Product name cannot exceed 150 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price cannot be negative"],
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    leadTime: {
      type: Number,
      required: [true, "Lead time is required"],
      min: [0, "Lead time cannot be negative"],
      default: 7,
    },
    safetyStock: {
      type: Number,
      required: [true, "Safety stock is required"],
      min: [0, "Safety stock cannot be negative"],
      default: 5,
    },
    image: {
      type: String,
      default: "", // Stores base64 data URI or image URL
    },
    dealer: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ user: 1, name: 1 });


productSchema.virtual("profitMargin").get(function () {
  const sp = typeof this.sellingPrice === "number" ? this.sellingPrice : 0;
  const cp = typeof this.costPrice === "number" ? this.costPrice : 0;
  if (sp > 0) {
    return Number((((sp - cp) / sp) * 100).toFixed(1));
  }
  return 0;
});


productSchema.virtual("inventoryValue").get(function () {
  const st = typeof this.stock === "number" ? this.stock : 0;
  const cp = typeof this.costPrice === "number" ? this.costPrice : 0;
  return Number((st * cp).toFixed(2));
});

module.exports = mongoose.model("Product", productSchema);
