
let _products = [];
let _reorders = [];


async function loadProductsFromDB() {
  if (typeof ProductAPI === "undefined") return _products;
  try {
    const res = await ProductAPI.getAll();
    if (res && res.data) {
      _products = res.data.map((p) => ({
        ...p,
        id: p._id || p.id,
      }));
    }
  } catch (err) {
    console.error("Failed to load products from MongoDB Atlas:", err);
  }
  return _products;
}

async function loadReordersFromDB() {
  if (typeof ReorderAPI === "undefined") return _reorders;
  try {
    const res = await ReorderAPI.getAll();
    if (res && res.data) {
      _reorders = res.data.map((r) => ({
        ...r,
        id: r._id || r.id,
        productId: r.productId?._id || r.productId,
      }));
    }
  } catch (err) {
    console.error("Failed to load reorders from MongoDB Atlas:", err);
  }
  return _reorders;
}

function getProducts() {
  return _products;
}

function getProductById(id) {
  return _products.find((p) => p.id === id || p._id === id);
}

function getReorders() {
  return _reorders;
}

function validateProduct(values, editingId) {
  const errors = {};

  if (!values.name || values.name.trim() === "") {
    errors.name = "Product name is required.";
  }

  if (values.name && values.name.trim() !== "") {
    const duplicate = _products.find(
      (p) =>
        p.name.trim().toLowerCase() === values.name.trim().toLowerCase() &&
        p.id !== editingId &&
        p._id !== editingId
    );
    if (duplicate) {
      errors.name = "A product with this name already exists.";
    }
  }

  if (!values.category || values.category.trim() === "") {
    errors.category = "Please select a category.";
  }

  if (values.costPrice === "" || isNaN(values.costPrice) || Number(values.costPrice) < 0) {
    errors.costPrice = "Enter a valid cost price (0 or more).";
  }

  if (values.sellingPrice === "" || isNaN(values.sellingPrice) || Number(values.sellingPrice) < 0) {
    errors.sellingPrice = "Enter a valid selling price (0 or more).";
  }

  if (values.stock === "" || isNaN(values.stock) || Number(values.stock) < 0) {
    errors.stock = "Stock cannot be empty or negative.";
  }

  if (values.leadTime === "" || isNaN(values.leadTime) || Number(values.leadTime) < 0) {
    errors.leadTime = "Lead time cannot be empty or negative.";
  }

  if (values.safetyStock === "" || isNaN(values.safetyStock) || Number(values.safetyStock) < 0) {
    errors.safetyStock = "Safety stock cannot be empty or negative.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}


async function addProduct(values, imageData) {
  const payload = {
    name: values.name.trim(),
    category: values.category.trim(),
    costPrice: Number(values.costPrice),
    sellingPrice: Number(values.sellingPrice),
    stock: Number(values.stock),
    leadTime: Number(values.leadTime),
    safetyStock: Number(values.safetyStock),
    image: imageData || "",
    dealer: values.dealer ? values.dealer.trim() : "",
  };

  const res = await ProductAPI.create(payload);
  if (!res || !res.data) {
    throw new Error(res?.error || "Failed to create product in MongoDB Atlas");
  }

 
  await loadProductsFromDB();

  return res.data;
}


async function updateProduct(id, values, imageData) {
  const payload = {
    name: values.name.trim(),
    category: values.category.trim(),
    costPrice: Number(values.costPrice),
    sellingPrice: Number(values.sellingPrice),
    stock: Number(values.stock),
    leadTime: Number(values.leadTime),
    safetyStock: Number(values.safetyStock),
    ...(imageData !== null ? { image: imageData } : {}),
    dealer: values.dealer ? values.dealer.trim() : undefined,
  };

  const res = await ProductAPI.update(id, payload);
  if (!res || !res.data) {
    throw new Error(res?.error || "Failed to update product in MongoDB Atlas");
  }

  await loadProductsFromDB();

  return res.data;
}

async function deleteProduct(id) {
  const res = await ProductAPI.delete(id);
  if (!res || !res.success) {
    throw new Error(res?.error || "Failed to delete product from MongoDB Atlas");
  }

  // Refresh products & sales directly from MongoDB Atlas
  await loadProductsFromDB();
  if (typeof loadSalesFromDB === "function") {
    await loadSalesFromDB();
  }
}

function validateReorder(values) {
  const errors = {};

  const quantity = Number(values.quantity);
  if (values.quantity === "" || isNaN(quantity) || quantity <= 0) {
    errors.quantity = "Enter a quantity greater than 0.";
  }

  const unitPrice = Number(values.unitPrice);
  if (values.unitPrice === "" || isNaN(unitPrice) || unitPrice < 0) {
    errors.unitPrice = "Unit price is invalid.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

async function placeReorder(productId, values) {
  const product = getProductById(productId);
  if (!product) throw new Error("Product not found");

  const quantity = Number(values.quantity);
  const unitPrice = Number(values.unitPrice);

  const res = await ReorderAPI.place({
    productId,
    quantity,
    unitPrice,
    dealer: (values.dealer || product.dealer || "").trim(),
    expectedDate: values.expectedDate || "",
    notes: (values.notes || "").trim(),
  });

  if (!res || !res.data) {
    throw new Error(res?.error || "Failed to place reorder in MongoDB Atlas");
  }

  await Promise.all([loadProductsFromDB(), loadReordersFromDB()]);

  return res.data;
}
