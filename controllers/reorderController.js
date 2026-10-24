const Reorder = require("../models/Reorder");
const Product = require("../models/Product");

/**
 * @desc    Place a reorder & restock product
 * @route   POST /api/reorders
 * @access  Private
 */
const placeReorder = async (req, res, next) => {
  try {
    const { productId, quantity, unitPrice, dealer, expectedDate, notes } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: "Product ID is required",
      });
    }

    const qty = Number(quantity);
    if (!qty || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: "Quantity must be a positive number greater than 0",
      });
    }

    const price = Number(unitPrice);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        error: "Unit price cannot be negative",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // 1) Create Reorder record
    const reorder = await Reorder.create({
      user: userId,
      productId: product._id,
      productName: product.name,
      quantity: qty,
      unitPrice: price,
      totalCost: Number((price * qty).toFixed(2)),
      dealer: dealer ? dealer.trim() : product.dealer || "",
      expectedDate: expectedDate || "",
      notes: notes ? notes.trim() : "",
      placedOn: new Date(),
      status: "Ordered",
    });

    // 2) Restock product and update supplier/cost price
    product.stock += qty;
    product.costPrice = price;
    if (dealer && dealer.trim()) {
      product.dealer = dealer.trim();
    }
    await product.save();

    res.status(201).json({
      success: true,
      message: "Reorder placed successfully and stock updated",
      data: reorder,
      updatedProduct: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reorders
 * @route   GET /api/reorders
 * @access  Private
 */
const getReorders = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.productId) {
      query.productId = req.query.productId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const reorders = await Reorder.find(query)
      .populate("productId", "name category stock image")
      .sort({ placedOn: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reorders.length,
      data: reorders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update reorder status (e.g. Received, Cancelled)
 * @route   PUT /api/reorders/:id
 * @access  Private
 */
const updateReorderStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const reorder = await Reorder.findById(req.params.id);

    if (!reorder) {
      return res.status(404).json({
        success: false,
        error: "Reorder record not found",
      });
    }

    if (status) reorder.status = status;
    if (notes !== undefined) reorder.notes = notes.trim();

    await reorder.save();

    res.status(200).json({
      success: true,
      message: "Reorder updated successfully",
      data: reorder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a reorder record
 * @route   DELETE /api/reorders/:id
 * @access  Private
 */
const deleteReorder = async (req, res, next) => {
  try {
    const reorder = await Reorder.findById(req.params.id);

    if (!reorder) {
      return res.status(404).json({
        success: false,
        error: "Reorder record not found",
      });
    }


    await Reorder.findByIdAndDelete(reorder._id);

    res.status(200).json({
      success: true,
      message: "Reorder record deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeReorder,
  getReorders,
  updateReorderStatus,
  deleteReorder,
};
