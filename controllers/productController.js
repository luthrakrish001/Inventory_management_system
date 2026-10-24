const Product = require("../models/Product");
const Sale = require("../models/Sale");
const Reorder = require("../models/Reorder");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (or fallback to public if no user)
 */
const createProduct = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const {
      name,
      category,
      costPrice,
      sellingPrice,
      stock,
      leadTime,
      safetyStock,
      image,
      dealer,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: "Product name and category are required",
      });
    }

    // Check duplicate name
    const existing = await Product.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "A product with this name already exists",
      });
    }

    const product = await Product.create({
      user: userId,
      name: name.trim(),
      category: category.trim(),
      costPrice: costPrice !== undefined ? Number(costPrice) : 0,
      sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : 0,
      stock: stock !== undefined ? Number(stock) : 0,
      leadTime: leadTime !== undefined ? Number(leadTime) : 7,
      safetyStock: safetyStock !== undefined ? Number(safetyStock) : 5,
      image: image || "",
      dealer: dealer ? dealer.trim() : "",
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products (with optional filtering, search, and sorting)
 * @route   GET /api/products
 * @access  Private
 */
const getProducts = async (req, res, next) => {
  try {
    const conditions = [];
    if (req.query.search) {
      conditions.push({
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { dealer: { $regex: req.query.search, $options: "i" } },
        ],
      });
    }

    // Filter by Category
    if (req.query.category && req.query.category !== "all") {
      conditions.push({ category: req.query.category });
    }

    // Filter by low stock / needs reorder
    if (req.query.status === "reorder") {
      conditions.push({ $expr: { $lte: ["$stock", "$safetyStock"] } });
    } else if (req.query.status === "healthy") {
      conditions.push({ $expr: { $gt: ["$stock", "$safetyStock"] } });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case "name":
          sortOptions = { name: 1 };
          break;
        case "stock":
          sortOptions = { stock: -1 };
          break;
        case "price":
        case "sellingPrice":
          sortOptions = { sellingPrice: -1 };
          break;
        case "costPrice":
          sortOptions = { costPrice: -1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }
    }

    const products = await Product.find(query).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Private
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const {
      name,
      category,
      costPrice,
      sellingPrice,
      stock,
      leadTime,
      safetyStock,
      image,
      dealer,
    } = req.body;

    // Check duplicate name if name changed
    if (name && name.trim().toLowerCase() !== product.name.toLowerCase()) {
      const duplicate = await Product.findOne({
        _id: { $ne: product._id },
        name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: "A product with this name already exists",
        });
      }
    }

    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (stock !== undefined) product.stock = Number(stock);
    if (leadTime !== undefined) product.leadTime = Number(leadTime);
    if (safetyStock !== undefined) product.safetyStock = Number(safetyStock);
    if (image !== undefined && image !== null) product.image = image;
    if (dealer !== undefined) product.dealer = dealer.trim();

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product (and cleanup associated sales)
 * @route   DELETE /api/products/:id
 * @access  Private
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }


    // Cascade delete: delete sales and reorders for this product
    await Sale.deleteMany({ productId: product._id });
    await Reorder.deleteMany({ productId: product._id });

    await Product.findByIdAndDelete(product._id);

    res.status(200).json({
      success: true,
      message: "Product and associated records deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
