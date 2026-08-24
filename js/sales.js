/* =========================================================
   sales.js
   -----------------------------------------------------------
   Business logic for recording sales. Recording a sale does
   TWO things:
     1. Adds a new entry to the "sales" array.
     2. Decreases the matching product's "stock" field.
========================================================= */

/**
 * Validates the sale form values.
 * Returns { isValid, errors } just like validateProduct().
 */
function validateSale(values) {
  const errors = {};

  if (!values.productId) {
    errors.productId = "Please select a product.";
  }

  const quantity = Number(values.quantity);
  if (values.quantity === "" || isNaN(quantity) || quantity <= 0) {
    errors.quantity = "Quantity must be a number greater than 0.";
  }

  // Extra check: can't sell more than what's currently in stock
  if (values.productId && !isNaN(quantity) && quantity > 0) {
    const product = getProductById(values.productId);
    if (product && quantity > product.stock) {
      errors.quantity = `Only ${product.stock} unit(s) left in stock.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Records a sale: saves it into the sales array AND
 * reduces the related product's stock by the sold quantity.
 */
function recordSale(values) {
  // 1) Save the sale record
  const sales = getSales();
  const newSale = {
    id: generateId("s"),
    productId: values.productId,
    quantity: Number(values.quantity),
    date: values.date || getTodayDate(),
  };
  saveSales([...sales, newSale]);

  // 2) Decrease stock on the matching product
  const products = getProducts();
  const updatedProducts = products.map((product) => {
    if (product.id !== values.productId) return product;
    return {
      ...product,
      stock: product.stock - newSale.quantity,
    };
  });
  saveProducts(updatedProducts);

  return newSale;
}

/**
 * Returns all sales belonging to one product,
 * sorted from oldest to newest by date.
 * forecast.js uses this to calculate the moving average.
 */
function getSalesForProduct(productId) {
  return getSales()
    .filter((sale) => sale.productId === productId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
