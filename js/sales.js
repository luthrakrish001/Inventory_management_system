
let _sales = [];

async function loadSalesFromDB() {
  if (typeof SaleAPI === "undefined") return _sales;
  try {
    const res = await SaleAPI.getAll();
    if (res && res.data) {
      _sales = res.data.map((s) => ({
        ...s,
        id: s._id || s.id,
        productId: s.productId?._id || s.productId || s.product,
      }));
    }
  } catch (err) {
    console.error("Failed to load sales from MongoDB Atlas:", err);
  }
  return _sales;
}

function getSales() {
  return _sales;
}

function validateSale(values) {
  const errors = {};

  if (!values.productId) {
    errors.productId = "Please select a product.";
  }

  const quantity = Number(values.quantity);
  if (values.quantity === "" || isNaN(quantity) || quantity <= 0) {
    errors.quantity = "Quantity must be a number greater than 0.";
  }

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

async function recordSale(values) {
  const res = await SaleAPI.record({
    productId: values.productId,
    quantity: Number(values.quantity),
    date: values.date || getTodayDate(),
  });

  if (!res || !res.data) {
    throw new Error(res?.error || "Failed to record sale in MongoDB Atlas");
  }

  await Promise.all([
    loadSalesFromDB(),
    typeof loadProductsFromDB === "function" ? loadProductsFromDB() : Promise.resolve(),
  ]);

  return res.data;
}

function getSalesForProduct(productId) {
  return _sales
    .filter(
      (sale) =>
        sale.productId === productId ||
        sale.productId?._id === productId ||
        sale.product === productId
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
