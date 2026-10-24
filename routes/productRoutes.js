const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { optionalAuth } = require("../middleware/authMiddleware");

// Products CRUD endpoints
router
  .route("/")
  .get(optionalAuth, getProducts)
  .post(optionalAuth, createProduct);

router
  .route("/:id")
  .get(optionalAuth, getProductById)
  .put(optionalAuth, updateProduct)
  .delete(optionalAuth, deleteProduct);

module.exports = router;
