function renderDashboard() {
  const visibleProducts = getFilteredAndSortedProducts();
  renderProductsTable(visibleProducts);
  renderStats();
  renderAlertBanner();
  renderTopSellingProducts();
  renderSoldProductsView();
  renderDailySalesView();
  renderReorderView();
}

function getFilteredAndSortedProducts() {
  const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
  const statusFilter = document.getElementById("filterStatus").value;
  const categoryFilterEl = document.getElementById("categoryFilter");
  const categoryFilter = categoryFilterEl ? categoryFilterEl.value : "all";
  const sortBy = document.getElementById("sortBy").value;

  let products = getProducts();


  products = products.map((product) => ({
    ...product,
    forecast: getProductForecast(product),
  }));

  if (searchTerm) {
    products = products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm)
    );
  }

  if (categoryFilter && categoryFilter !== "all") {
    products = products.filter((product) => product.category === categoryFilter);
  }

  if (statusFilter !== "all") {
    products = products.filter((product) => product.forecast.status === statusFilter);
  }


  products.sort((a, b) => {
    switch (sortBy) {
      case "stock":
        return a.stock - b.stock;
      case "demand":
        return b.forecast.averageDemand - a.forecast.averageDemand;
      case "reorder":
        return b.forecast.reorderPoint - a.forecast.reorderPoint;
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return products;
}

function renderProductsTable(products) {
  const tbody = document.getElementById("productsTableBody");
  const emptyState = document.getElementById("emptyState");

  tbody.innerHTML = ""; // clear previous render before repainting

  if (products.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  products.forEach((product) => {
    const row = buildProductRow(product);
    tbody.appendChild(row);
  });
}

function buildProductRow(product) {
  const tr = document.createElement("tr");
  const { averageDemand, reorderPoint, status } = product.forecast;

  const statusBadge =
    status === "reorder"
      ? `<span class="badge badge-danger">🔴 Needs Reorder</span>`
      : `<span class="badge badge-healthy">🟢 Healthy</span>`;

  const thumbHtml = product.image
    ? `<img src="${product.image}" alt="${product.name}" class="product-thumb" />`
    : `<div class="product-thumb-placeholder">${getInitials(product.name)}</div>`;

  tr.innerHTML = `
    <td>
      <div class="product-cell">
        ${thumbHtml}
        <div>
          <div class="product-name">${product.name}</div>
        </div>
      </div>
    </td>
    <td><span class="product-category">${product.category}</span></td>
    <td class="mono">₹${product.costPrice}</td>
    <td class="mono">₹${product.sellingPrice}</td>
    <td class="mono">${product.stock}</td>
    <td class="mono">${averageDemand}</td>
    <td class="mono">${product.leadTime}d</td>
    <td class="mono">${product.safetyStock}</td>
    <td class="mono">${reorderPoint}</td>
    <td>${statusBadge}</td>
    <td>
      <div class="row-actions">
        <button class="btn-icon-sm primary" data-action="edit" data-id="${product.id}" title="Edit">&#9998;</button>
        <button class="btn-icon-sm danger" data-action="delete" data-id="${product.id}" title="Delete">&#128465;</button>
      </div>
    </td>
  `;

  return tr;
}

function buildReorderRow(product) {
  const tr = document.createElement("tr");
  const { averageDemand, reorderPoint } = product.forecast;

  const thumbHtml = product.image
    ? `<img src="${product.image}" alt="${product.name}" class="product-thumb" />`
    : `<div class="product-thumb-placeholder">${getInitials(product.name)}</div>`;

  tr.innerHTML = `
    <td>
      <div class="product-cell">
        ${thumbHtml}
        <div>
          <div class="product-name">${product.name}</div>
        </div>
      </div>
    </td>
    <td><span class="product-category">${product.category}</span></td>
    <td class="mono">₹${product.costPrice}</td>
    <td class="mono">₹${product.sellingPrice}</td>
    <td class="mono">${product.stock}</td>
    <td class="mono">${averageDemand}</td>
    <td class="mono">${product.leadTime}d</td>
    <td class="mono">${product.safetyStock}</td>
    <td class="mono">${reorderPoint}</td>
    <td>
      <button class="btn btn-sm btn-primary" data-action="reorder" data-id="${product.id}">Reorder</button>
    </td>
    <td>
      <div class="row-actions">
        <button class="btn-icon-sm primary" data-action="edit" data-id="${product.id}" title="Edit">&#9998;</button>
        <button class="btn-icon-sm danger" data-action="delete" data-id="${product.id}" title="Delete">&#128465;</button>
      </div>
    </td>
  `;

  return tr;
}

function renderStats() {
  const products = getProducts().map((product) => ({
    ...product,
    forecast: getProductForecast(product),
  }));
  const sales = getSales();

  const healthyCount = products.filter((p) => p.forecast.status === "healthy").length;
  const reorderCount = products.filter((p) => p.forecast.status === "reorder").length;

  document.getElementById("statTotalProducts").textContent = products.length;
  document.getElementById("statHealthy").textContent = healthyCount;
  document.getElementById("statReorder").textContent = reorderCount;
  document.getElementById("statTotalSales").textContent = sales.length;
  const totalInrValue = calculateTotalInventoryValue();
  document.getElementById("statInventoryValue").textContent = `₹${totalInrValue.toLocaleString("en-IN")}`;
  renderInventoryValueInUsd(totalInrValue);
}

function renderAlertBanner() {
  const products = getProducts().map((product) => ({
    ...product,
    forecast: getProductForecast(product),
  }));

  const needsReorder = products.filter((p) => p.forecast.status === "reorder");
  const banner = document.getElementById("alertBanner");
  const alertText = document.getElementById("alertText");

  if (needsReorder.length === 0) {
    banner.classList.add("hidden");
    return;
  }

  const names = needsReorder.map((p) => p.name).join(", ");
  alertText.textContent = `${needsReorder.length} product(s) need reordering: ${names}`;
  banner.classList.remove("hidden");
}

function renderTopSellingProducts() {
  const container = document.getElementById("topProductsList");
  const emptyState = document.getElementById("topProductsEmpty");
  if (!container) return;

  const topProducts = getTopSellingProducts();

  container.innerHTML = "";

  if (topProducts.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  const highestQuantity = topProducts[0].quantitySold;

  topProducts.forEach((entry, index) => {
    container.appendChild(buildTopProductRow(entry, index, highestQuantity));
  });
}

function buildTopProductRow(entry, index, highestQuantity) {
  const { product, quantitySold } = entry;
  const row = document.createElement("div");
  row.className = "top-product-row";

  const barPercent = highestQuantity > 0 ? Math.round((quantitySold / highestQuantity) * 100) : 0;

  row.innerHTML = `
    <span class="top-product-rank">#${index + 1}</span>
    <div class="top-product-info">
      <span class="top-product-name">${product.name}</span>
      <div class="top-product-bar-track">
        <div class="top-product-bar-fill" style="width: ${barPercent}%"></div>
      </div>
    </div>
    <span class="top-product-qty mono">${quantitySold} sold</span>
  `;

  return row;
}

function populateCategorySelect(selectEl, { includeAllOption = false, selectedValue = "" } = {}) {
  if (!selectEl) return;

  const categories = getSortedCategories();

  selectEl.innerHTML = "";

  const firstOption = document.createElement("option");
  if (includeAllOption) {
    firstOption.value = "all";
    firstOption.textContent = "All Categories";
  } else {
    firstOption.value = "";
    firstOption.textContent = "-- Select a category --";
  }
  selectEl.appendChild(firstOption);

  if (!includeAllOption && selectedValue && !categories.includes(selectedValue)) {
    categories.push(selectedValue);
    categories.sort((a, b) => a.localeCompare(b));
  }

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    selectEl.appendChild(option);
  });

  selectEl.value = includeAllOption ? "all" : selectedValue;
}

function populateProductCategorySelect(selectedValue = "") {
  populateCategorySelect(document.getElementById("productCategory"), {
    includeAllOption: false,
    selectedValue,
  });
}

function populateCategoryFilterDropdown() {
  const select = document.getElementById("categoryFilter");
  if (!select) return;

  const previousValue = select.value || "all";
  populateCategorySelect(select, { includeAllOption: true, selectedValue: "all" });

  const stillExists = Array.from(select.options).some((opt) => opt.value === previousValue);
  select.value = stillExists ? previousValue : "all";
}

function renderCategoriesList() {
  const listEl = document.getElementById("categoriesList");
  const emptyEl = document.getElementById("categoriesEmptyState");
  if (!listEl) return;

  const categories = getSortedCategories();
  listEl.innerHTML = "";

  if (categories.length === 0) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  categories.forEach((category) => {
    const li = document.createElement("li");
    li.className = "category-row";
    li.innerHTML = `
      <span>${category}</span>
      <button type="button" class="btn-icon-sm danger" data-action="delete-category" data-name="${category}" title="Delete category">&#128465;</button>
    `;
    listEl.appendChild(li);
  });
}


function switchDashboardView(section) {
  const views = {
    dashboard: document.getElementById("dashboardView"),
    products: document.getElementById("soldProductsView"),
    alerts: document.getElementById("reorderView"),
  };

  Object.keys(views).forEach((key) => {
    const el = views[key];
    if (!el) return;
    el.classList.toggle("hidden", key !== section);
  });

  if (section === "products") {
    renderSoldProductsView();
    renderDailySalesView();
  }
  if (section === "alerts") renderReorderView();
}

function renderSoldProductsView() {
  const tbody = document.getElementById("soldProductsTableBody");
  const emptyState = document.getElementById("soldProductsEmptyState");
  if (!tbody) return;

  const { soldProducts, totalItemsSold, totalRevenue, totalProfit } = getSoldProductsSummary();

  document.getElementById("statSoldTotalItems").textContent = totalItemsSold;
  document.getElementById("statSoldTotalRevenue").textContent =
    `₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  document.getElementById("statSoldTotalProfit").textContent =
    `₹${totalProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  tbody.innerHTML = "";

  if (soldProducts.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  soldProducts.forEach((entry) => {
    tbody.appendChild(buildSoldProductRow(entry));
  });
}

function buildSoldProductRow(entry) {
  const { product, quantitySold, revenue, profit } = entry;
  const tr = document.createElement("tr");

  const thumbHtml = product.image
    ? `<img src="${product.image}" alt="${product.name}" class="product-thumb" />`
    : `<div class="product-thumb-placeholder">${getInitials(product.name)}</div>`;

  tr.innerHTML = `
    <td>
      <div class="product-cell">
        ${thumbHtml}
        <div class="product-name">${product.name}</div>
      </div>
    </td>
    <td><span class="product-category">${product.category}</span></td>
    <td class="mono">${quantitySold}</td>
    <td class="mono">₹${revenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
    <td class="mono">₹${profit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
  `;

  return tr;
}

function renderDailySalesView() {
  const dateInput = document.getElementById("dailySalesDate");
  const tbody = document.getElementById("dailySalesTableBody");
  const emptyState = document.getElementById("dailySalesEmptyState");
  const summaryEl = document.getElementById("dailySalesSummary");
  if (!dateInput || !tbody) return;

  const selectedDate = dateInput.value || getTodayDate();
  const { dailyProducts, totalItemsSold, totalRevenue, totalProfit } = getDailySalesSummary(selectedDate);

  summaryEl.innerHTML = `
    <div class="daily-summary-chip">
      <span class="daily-summary-label">Items Sold</span>
      <span class="daily-summary-value">${totalItemsSold}</span>
    </div>
    <div class="daily-summary-chip">
      <span class="daily-summary-label">Revenue</span>
      <span class="daily-summary-value">₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
    </div>
    <div class="daily-summary-chip daily-summary-chip-success">
      <span class="daily-summary-label">Profit</span>
      <span class="daily-summary-value">₹${totalProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
    </div>
  `;

  tbody.innerHTML = "";

  if (dailyProducts.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  dailyProducts.forEach((entry) => {
    tbody.appendChild(buildSoldProductRow(entry));
  });
}

function renderReorderView() {
  const tbody = document.getElementById("reorderTableBody");
  const emptyState = document.getElementById("reorderEmptyState");
  if (!tbody) return;

  const reorderProducts = getProducts()
    .map((product) => ({ ...product, forecast: getProductForecast(product) }))
    .filter((product) => product.forecast.status === "reorder")
    .sort((a, b) => a.stock - b.stock);

  tbody.innerHTML = "";

  if (reorderProducts.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  reorderProducts.forEach((product) => {
    tbody.appendChild(buildReorderRow(product));
  });
}

function populateSaleProductDropdown() {
  const select = document.getElementById("saleProduct");
  const products = getProducts();

  select.innerHTML = `<option value="">-- Select a product --</option>`;

  products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} (${product.stock} in stock)`;
    select.appendChild(option);
  });
}
