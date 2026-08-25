/* =========================================================
   product.js


/**
 * Validates the raw form values for a product.
 * Returns an object like { isValid: true/false, errors: {...} }
 * so app.js can display each error under the right input field.
 *
 * editingId is passed in so that, when EDITING a product, we don't
 * flag the product's own current name as a "duplicate".
 */
function validateProduct(values, editingId) {
  const errors = {};

  // Rule: name cannot be empty
  if (!values.name || values.name.trim() === "") {
    errors.name = "Product name is required.";
  }

  // Rule: name cannot duplicate another existing product (case-insensitive)
  if (values.name && values.name.trim() !== "") {
    const products = getProducts();
    const duplicate = products.find(
      (p) =>
        p.name.trim().toLowerCase() === values.name.trim().toLowerCase() &&
        p.id !== editingId
    );
    if (duplicate) {
      errors.name = "A product with this name already exists.";
    }
  }

  // Rule: category is required and must be one of the owner's
  // defined categories (picked from the dropdown, not typed).
  if (!values.category || values.category.trim() === "") {
    errors.category = "Please select a category.";
  }

  // Rule: cost price must be a non-negative number
  if (values.costPrice === "" || isNaN(values.costPrice) || Number(values.costPrice) < 0) {
    errors.costPrice = "Enter a valid cost price (0 or more).";
  }

  // Rule: selling price must be a non-negative number
  if (values.sellingPrice === "" || isNaN(values.sellingPrice) || Number(values.sellingPrice) < 0) {
    errors.sellingPrice = "Enter a valid selling price (0 or more).";
  }

  // Rule: stock cannot be negative
  if (values.stock === "" || isNaN(values.stock) || Number(values.stock) < 0) {
    errors.stock = "Stock cannot be empty or negative.";
  }

  // Rule: lead time cannot be negative
  if (values.leadTime === "" || isNaN(values.leadTime) || Number(values.leadTime) < 0) {
    errors.leadTime = "Lead time cannot be empty or negative.";
  }

  // Rule: safety stock cannot be negative
  if (values.safetyStock === "" || isNaN(values.safetyStock) || Number(values.safetyStock) < 0) {
    errors.safetyStock = "Safety stock cannot be empty or negative.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Adds a brand new product to localStorage.
 * `values` is the already-validated form data.
 * `imageData` is the base64 string of the uploaded photo, or "" if none.
 */
function addProduct(values, imageData) {
  const products = getProducts();

  const newProduct = {
    id: generateId("p"),
    name: values.name.trim(),
    category: values.category.trim(),
    costPrice: Number(values.costPrice),
    sellingPrice: Number(values.sellingPrice),
    stock: Number(values.stock),
    leadTime: Number(values.leadTime),
    safetyStock: Number(values.safetyStock),
    image: imageData || "",
  };

  // Spread operator: build a new array = old products + the new one
  const updatedProducts = [...products, newProduct];
  saveProducts(updatedProducts);

  return newProduct;
}

/**
 * Updates an existing product (used by the Edit flow).
 * We use Array.map() to rebuild the array, replacing only the
 * product whose id matches, and leaving every other product untouched.
 */
function updateProduct(id, values, imageData) {
  const products = getProducts();

  const updatedProducts = products.map((product) => {
    if (product.id !== id) return product; // leave other products as-is

    return {
      ...product, // keep the id and anything we don't overwrite
      name: values.name.trim(),
      category: values.category.trim(),
      costPrice: Number(values.costPrice),
      sellingPrice: Number(values.sellingPrice),
      stock: Number(values.stock),
      leadTime: Number(values.leadTime),
      safetyStock: Number(values.safetyStock),
      // Only replace the image if a new one was uploaded,
      // otherwise keep the existing photo.
      image: imageData !== null ? imageData : product.image,
    };
  });

  saveProducts(updatedProducts);
}

/**
 * Deletes a product AND every sale record that belonged to it,
 * so we don't leave "orphan" sales pointing to a product that
 * no longer exists.
 */
function deleteProduct(id) {
  const products = getProducts().filter((product) => product.id !== id);
  saveProducts(products);

  const sales = getSales().filter((sale) => sale.productId !== id);
  saveSales(sales);
}

/**
 * Looks up a single product by its id.
 * Returns undefined if not found.
 */
function getProductById(id) {
  return getProducts().find((product) => product.id === id);
}

/**
 * Validates the "Reorder" form values (opened from the Reorder
 * Alerts page). Returns { isValid, errors } just like validateProduct().
 */
function validateReorder(values) {
  const errors = {};

  const quantity = Number(values.quantity);
  if (values.quantity === "" || isNaN(quantity) || quantity <= 0) {
    errors.quantity = "Enter a quantity greater than 0.";
  }

  const unitPrice = Number(values.unitPrice);
  if (values.unitPrice === "" || isNaN(unitPrice) || unitPrice < 0) {
    errors.unitPrice = "Unit price is invalid — reopen the reorder form.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Places a reorder for one product:
 *   1. Logs the reorder (product, quantity, dealer, unit price,
 *      expected delivery date, notes) into reorder history.
 *   2. Adds the reordered quantity straight onto the product's
 *      current stock, so it immediately reflects the restock.
 *   3. Remembers the unit price as the product's new cost price
 *      and keeps the dealer name on the product, so the next
 *      reorder for it can default to the same supplier.
 * Returns the new reorder record.
 */
function placeReorder(productId, values) {
  const product = getProductById(productId);
  if (!product) return null;

  const quantity = Number(values.quantity);
  const unitPrice = Number(values.unitPrice);

  // 1) Log the reorder
  const reorders = getReorders();
  const newReorder = {
    id: generateId("ro"),
    productId,
    productName: product.name,
    quantity,
    unitPrice,
    dealer: values.dealer.trim(),
    expectedDate: values.expectedDate || "",
    notes: values.notes ? values.notes.trim() : "",
    placedOn: getTodayDate(),
  };
  saveReorders([...reorders, newReorder]);

  // 2) & 3) Update the product's stock, cost price, and dealer
  const updatedProducts = getProducts().map((p) => {
    if (p.id !== productId) return p;
    return {
      ...p,
      stock: p.stock + quantity,
      costPrice: unitPrice,
      dealer: values.dealer.trim(),
    };
  });
  saveProducts(updatedProducts);

  return newReorder;
}
