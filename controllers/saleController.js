const Sale = require("../models/Sale");
const Product = require("../models/Product");


const recordSale = async (req, res, next) => {
  try {
    const { productId, quantity, date } = req.body;
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

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Verify stock availability
    if (qty > product.stock) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock! Only ${product.stock} unit(s) available.`,
      });
    }

    // Deduct stock from product
    product.stock -= qty;
    await product.save();

    // Create sale record
    const sale = await Sale.create({
      user: userId,
      productId: product._id,
      productName: product.name,
      quantity: qty,
      unitPrice: product.sellingPrice,
      totalAmount: Number((product.sellingPrice * qty).toFixed(2)),
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Sale recorded successfully and stock updated",
      data: sale,
      updatedStock: product.stock,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all sales
 * @route   GET /api/sales
 * @access  Private
 */
const getSales = async (req, res, next) => {
  try {
    const query = {};

    // Filter by product ID
    if (req.query.productId) {
      query.productId = req.query.productId;
    }

    // Filter by specific date (e.g. YYYY-MM-DD)
    if (req.query.date) {
      const targetDate = new Date(req.query.date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const sales = await Sale.find(query)
      .populate("productId", "name category costPrice sellingPrice stock image")
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get sales history for a specific product (ordered oldest to newest for demand forecasting)
 * @route   GET /api/sales/product/:productId
 * @access  Private
 */
const getSalesByProduct = async (req, res, next) => {
  try {
    const query = { productId: req.params.productId };

    const sales = await Sale.find(query).sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a sale & optionally restore product stock
 * @route   DELETE /api/sales/:id
 * @access  Private
 */
const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: "Sale record not found",
      });
    }

    // Restore stock if restoreStock flag is passed (defaults to true)
    if (req.query.restoreStock !== "false") {
      await Product.findByIdAndUpdate(sale.productId, {
        $inc: { stock: sale.quantity },
      });
    }

    await Sale.findByIdAndDelete(sale._id);

    res.status(200).json({
      success: true,
      message: "Sale record deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordSale,
  getSales,
  getSalesByProduct,
  deleteSale,
};
