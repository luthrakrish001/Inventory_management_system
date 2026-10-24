const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [60, "Category name cannot exceed 60 characters"],
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ user: 1, name: 1 });

module.exports = mongoose.model("Category", categorySchema);
