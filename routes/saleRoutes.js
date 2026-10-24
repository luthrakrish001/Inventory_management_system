const express = require("express");
const router = express.Router();
const {
  recordSale,
  getSales,
  getSalesByProduct,
  deleteSale,
} = require("../controllers/saleController");
const { optionalAuth } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(optionalAuth, getSales)
  .post(optionalAuth, recordSale);

router.get("/product/:productId", optionalAuth, getSalesByProduct);

router.route("/:id").delete(optionalAuth, deleteSale);

module.exports = router;
