const express = require("express");
const router = express.Router();
const { getDashboardAnalytics } = require("../controllers/analyticsController");
const { optionalAuth } = require("../middleware/authMiddleware");

router.get("/dashboard", optionalAuth, getDashboardAnalytics);

module.exports = router;
