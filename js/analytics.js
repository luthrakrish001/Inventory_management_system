
const TOP_SELLING_LIMIT = 5;


function getTopSellingProducts(limit = TOP_SELLING_LIMIT) {
  const sales = getSales();
  const products = getProducts();
  const totalsByProductId = sales.reduce((totals, sale) => {
    totals[sale.productId] = (totals[sale.productId] || 0) + sale.quantity;
    return totals;
  }, {});


  const ranked = Object.keys(totalsByProductId)
    .map((productId) => {
      const product = getProductById(productId);
      if (!product) return null; // product was deleted since the sale was recorded
      return { product, quantitySold: totalsByProductId[productId] };
    })
    .filter((entry) => entry !== null);


  ranked.sort((a, b) => b.quantitySold - a.quantitySold);

  return ranked.slice(0, limit);
}


function getSoldProductsSummary() {
  const sales = getSales();


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


  const totalItemsSold = soldProducts.reduce((sum, entry) => sum + entry.quantitySold, 0);
  const totalRevenue = soldProducts.reduce((sum, entry) => sum + entry.revenue, 0);
  const totalProfit = soldProducts.reduce((sum, entry) => sum + entry.profit, 0);

  return { soldProducts, totalItemsSold, totalRevenue, totalProfit };
}


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


function calculateTotalInventoryValue() {
  const products = getProducts();
  return products.reduce((total, product) => total + product.costPrice * product.stock, 0);
}
