/* =========================================================
   analytics.js
   -----------------------------------------------------------
   Small reporting helpers built on TOP of products.js/sales.js
   data. Like forecast.js, this file is pure calculation logic
   — no DOM, no localStorage writes — so ui.js can call it and
   just render whatever comes back.
========================================================= */

// How many products to show in the "Top Selling Products" list.
const TOP_SELLING_LIMIT = 5;

/**
 * Ranks products by total units sold across ALL recorded sales.
 *
 * Steps:
 *  1. reduce() over every sale to build a { productId: totalQty }
 *     lookup — this is the "Higher Order Functions" pattern from
 *     the syllabus (accumulating a total from a list).
 *  2. Turn that lookup into an array of { product, quantitySold },
 *     attaching the actual product object so ui.js has the name,
 *     category, image, etc. ready to render.
 *  3. sort() descending by quantitySold, then slice() to the top N.
 *
 * Products that were deleted (but still have old sale records)
 * are filtered out rather than crashing the app.
 */
function getTopSellingProducts(limit = TOP_SELLING_LIMIT) {
  const sales = getSales();
  const products = getProducts();

  // 1) Total quantity sold per productId
  const totalsByProductId = sales.reduce((totals, sale) => {
    totals[sale.productId] = (totals[sale.productId] || 0) + sale.quantity;
    return totals;
  }, {});

  // 2) Attach the matching product to each total
  const ranked = Object.keys(totalsByProductId)
    .map((productId) => {
      const product = getProductById(productId);
      if (!product) return null; // product was deleted since the sale was recorded
      return { product, quantitySold: totalsByProductId[productId] };
    })
    .filter((entry) => entry !== null);

  // 3) Highest quantity sold first, then only keep the top N
  ranked.sort((a, b) => b.quantitySold - a.quantitySold);

  return ranked.slice(0, limit);
}

/**
 * Builds the data for the "Sold Products" page: every product
 * that has at least one recorded sale, how many units of it
 * were sold in total, the revenue that generated, and the
 * profit (at CURRENT cost/selling price — this app doesn't
 * store a price snapshot per sale, so profit reflects today's
 * prices applied to historical quantities).
 */
function getSoldProductsSummary() {
  const sales = getSales();

  // Total quantity sold per productId (same pattern as
  // getTopSellingProducts above).
  const totalsByProductId = sales.reduce((totals, sale) => {
    totals[sale.productId] = (totals[sale.productId] || 0) + sale.quantity;
    return totals;
  }, {});

  const soldProducts = Object.keys(totalsByProductId)
    .map((productId) => {
      const product = getProductById(productId);
      if (!product) return null; // product was deleted since the sale was recorded

      const quantitySold = totalsByProductId[productId];
      const revenue = quantitySold * product.sellingPrice;
      const profit = quantitySold * (product.sellingPrice - product.costPrice);

      return { product, quantitySold, revenue, profit };
    })
    .filter((entry) => entry !== null)
    .sort((a, b) => b.quantitySold - a.quantitySold);

  // Grand totals across every sold product, using reduce() again.
  const totalItemsSold = soldProducts.reduce((sum, entry) => sum + entry.quantitySold, 0);
  const totalRevenue = soldProducts.reduce((sum, entry) => sum + entry.revenue, 0);
  const totalProfit = soldProducts.reduce((sum, entry) => sum + entry.profit, 0);

  return { soldProducts, totalItemsSold, totalRevenue, totalProfit };
}

/**
 * Builds the data for the "Daily Sales" lookup on the Sold
 * Products page: given one date (YYYY-MM-DD, matching the sale
 * form's date input), returns every product sold on that date
 * with its quantity/revenue/profit, plus totals for the day.
 * Same reduce -> map -> sort pipeline as getSoldProductsSummary,
 * just pre-filtered to one date first.
 */
function getDailySalesSummary(dateStr) {
  const salesForDate = getSales().filter((sale) => sale.date === dateStr);

  const totalsByProductId = salesForDate.reduce((totals, sale) => {
    totals[sale.productId] = (totals[sale.productId] || 0) + sale.quantity;
    return totals;
  }, {});

  const dailyProducts = Object.keys(totalsByProductId)
    .map((productId) => {
      const product = getProductById(productId);
      if (!product) return null;

      const quantitySold = totalsByProductId[productId];
      const revenue = quantitySold * product.sellingPrice;
      const profit = quantitySold * (product.sellingPrice - product.costPrice);

      return { product, quantitySold, revenue, profit };
    })
    .filter((entry) => entry !== null)
    .sort((a, b) => b.quantitySold - a.quantitySold);

  const totalItemsSold = dailyProducts.reduce((sum, entry) => sum + entry.quantitySold, 0);
  const totalRevenue = dailyProducts.reduce((sum, entry) => sum + entry.revenue, 0);
  const totalProfit = dailyProducts.reduce((sum, entry) => sum + entry.profit, 0);

  return { dailyProducts, totalItemsSold, totalRevenue, totalProfit };
}

/**
 * Total value (at cost price) of everything currently sitting in
 * stock: sum of (costPrice × stock) across every product.
 * Used for the "Inventory Value" stat card, and as the base amount
 * that currency.js converts to USD via the Fetch API.
 */
function calculateTotalInventoryValue() {
  const products = getProducts();
  return products.reduce((total, product) => total + product.costPrice * product.stock, 0);
}
