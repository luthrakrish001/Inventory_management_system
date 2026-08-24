/* =========================================================
   forecast.js
   -----------------------------------------------------------
   Pure calculation logic — no DOM, no localStorage writes.
   Everything here just takes numbers in and returns numbers
   out, which makes it easy to reason about and test.
========================================================= */

// How many of the most recent sales we average over.
const MOVING_AVERAGE_WINDOW = 5;

/**
 * Calculates the average daily demand for one product using a
 * MOVING AVERAGE of its last N sales quantities.
 *
 * Example: last 5 sale quantities = [4, 6, 5, 3, 7]
 * Average demand = (4+6+5+3+7) / 5 = 5
 *
 * If the product has fewer than N sales, we simply average
 * whatever sales exist. If it has zero sales, demand is 0.
 */
function calculateAverageDemand(productId) {
  const sales = getSalesForProduct(productId);

  if (sales.length === 0) return 0;

  // Take only the last N sales (most recent ones)
  const recentSales = sales.slice(-MOVING_AVERAGE_WINDOW);

  // Array.reduce() adds up all the quantities into one total
  const totalQuantity = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);

  const average = totalQuantity / recentSales.length;

  // Round to 2 decimal places so the UI doesn't show long decimals
  return Math.round(average * 100) / 100;
}

/**
 * Reorder Point formula:
 *   Reorder Point = (Average Daily Demand × Lead Time) + Safety Stock
 *
 * This tells us: "by the time a new order arrives (lead time days),
 * how much stock will we have burned through, plus a safety buffer?"
 */
function calculateReorderPoint(averageDemand, leadTime, safetyStock) {
  const reorderPoint = averageDemand * leadTime + safetyStock;
  return Math.round(reorderPoint * 100) / 100;
}

/**
 * Decides the status badge for a product:
 * 🔴 Needs Reorder  -> when current stock has dropped to/below the reorder point
 * 🟢 Healthy        -> otherwise
 */
function getInventoryStatus(currentStock, reorderPoint) {
  return currentStock <= reorderPoint ? "reorder" : "healthy";
}

/**
 * Convenience function that bundles ALL forecast numbers for one
 * product together, so ui.js can call one function per product
 * instead of three separate ones.
 */
function getProductForecast(product) {
  const averageDemand = calculateAverageDemand(product.id);
  const reorderPoint = calculateReorderPoint(
    averageDemand,
    product.leadTime,
    product.safetyStock
  );
  const status = getInventoryStatus(product.stock, reorderPoint);

  return { averageDemand, reorderPoint, status };
}
