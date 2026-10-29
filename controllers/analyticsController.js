const Product = require("../models/Product");
const Sale = require("../models/Sale");
const Reorder = require("../models/Reorder");


const getDashboardAnalytics = async (req, res, next) => {
  try {
    const products = await Product.find({});
    const sales = await Sale.find({});
    const reorders = await Reorder.find({});

  
    let totalStockUnits = 0;
    let totalInventoryCostValue = 0;
    let totalPotentialRetailValue = 0;
    let lowStockCount = 0;
    const categoryCounts = {};

    products.forEach((prod) => {
      totalStockUnits += prod.stock;
      totalInventoryCostValue += prod.stock * prod.costPrice;
      totalPotentialRetailValue += prod.stock * prod.sellingPrice;

      if (prod.stock <= prod.safetyStock) {
        lowStockCount++;
      }

      if (prod.category) {
        categoryCounts[prod.category] = (categoryCounts[prod.category] || 0) + 1;
      }
    });

    // Calculate sales metrics
    let totalRevenue = 0;
    let totalUnitsSold = 0;
    sales.forEach((s) => {
      totalRevenue += s.totalAmount || s.quantity * (s.unitPrice || 0);
      totalUnitsSold += s.quantity;
    });

    // Calculate reorder metrics
    let totalReordersCount = reorders.length;
    let totalReorderCost = reorders.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        products: {
          totalCount: products.length,
          totalStockUnits,
          totalInventoryCostValue: Number(totalInventoryCostValue.toFixed(2)),
          totalPotentialRetailValue: Number(totalPotentialRetailValue.toFixed(2)),
          potentialGrossProfit: Number(
            (totalPotentialRetailValue - totalInventoryCostValue).toFixed(2)
          ),
          lowStockCount,
        },
        sales: {
          totalSalesCount: sales.length,
          totalUnitsSold,
          totalRevenue: Number(totalRevenue.toFixed(2)),
        },
        reorders: {
          totalCount: totalReordersCount,
          totalCost: Number(totalReorderCost.toFixed(2)),
        },
        categoryDistribution: categoryCounts,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
};
