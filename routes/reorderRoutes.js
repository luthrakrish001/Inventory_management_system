const express = require("express");
const router = express.Router();
const {
  placeReorder,
  getReorders,
  updateReorderStatus,
  deleteReorder,
} = require("../controllers/reorderController");
const { optionalAuth } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(optionalAuth, getReorders)
  .post(optionalAuth, placeReorder);

router
  .route("/:id")
  .put(optionalAuth, updateReorderStatus)
  .delete(optionalAuth, deleteReorder);

module.exports = router;
