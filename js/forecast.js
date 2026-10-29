const MOVING_AVERAGE_WINDOW = 5;

function calculateAverageDemand(productId) {
  const sales = getSalesForProduct(productId);

  if (sales.length === 0) return 0;

  const recentSales = sales.slice(-MOVING_AVERAGE_WINDOW);

  const totalQuantity = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);

  const average = totalQuantity / recentSales.length;

  return Math.round(average * 100) / 100;
}

function calculateReorderPoint(averageDemand, leadTime, safetyStock) {
  const reorderPoint = averageDemand * leadTime + safetyStock;
  return Math.round(reorderPoint * 100) / 100;
}

function getInventoryStatus(currentStock, reorderPoint) {
  return currentStock <= reorderPoint ? "reorder" : "healthy";
}

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
