const express = require("express");
const router = express.Router();
const {
  getCategories,
  createCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { optionalAuth } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(optionalAuth, getCategories)
  .post(optionalAuth, createCategory);

router.route("/:id").delete(optionalAuth, deleteCategory);

module.exports = router;
