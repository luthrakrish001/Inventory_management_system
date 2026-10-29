const Category = require("../models/Category");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private
 */
const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Category name is required",
      });
    }

    const trimmedName = name.trim();
    const userId = req.user ? req.user._id : null;

    // Check duplicate
    const duplicate = await Category.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: "This category already exists",
      });
    }

    const category = await Category.create({
      user: userId,
      name: trimmedName,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a category by ID or name
 * @route   DELETE /api/categories/:id
 * @access  Private
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = {};

    // Support deleting by ObjectId or by Category Name
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      const decoded = decodeURIComponent(id).trim();
      query.name = { $regex: new RegExp(`^${escapeRegex(decoded)}$`, "i") };
    }

    let category = await Category.findOneAndDelete(query);
    if (!category) {
      const fallbackQuery = id.match(/^[0-9a-fA-F]{24}$/)
        ? { _id: id }
        : { name: decodeURIComponent(id) };
      category = await Category.findOneAndDelete(fallbackQuery);
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: { id: category._id, name: category.name },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};
