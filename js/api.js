
const API_BASE_URL =
  window.location.port === "5000"
    ? "/api"
    : `http://${window.location.hostname || "localhost"}:5000/api`;


function getAuthToken() {
  try {
    return sessionStorage.getItem("token") || "";
  } catch (e) {
    return "";
  }
}


async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "An API error occurred");
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}


const AuthAPI = {
  register: (name, email, password) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: async (email, password) => {
    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      sessionStorage.setItem("token", res.token);
      try {
        localStorage.removeItem("token");
      } catch (e) {}
    }
    return res;
  },

  getProfile: () => apiRequest("/auth/me"),

  logout: () => {
    try {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
    } catch (e) {}
  },
};


const ProductAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/products${query ? `?${query}` : ""}`);
  },

  getById: (id) => apiRequest(`/products/${id}`),

  create: (product) =>
    apiRequest("/products", {
      method: "POST",
      body: JSON.stringify(product),
    }),

  update: (id, updates) =>
    apiRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  delete: (id) =>
    apiRequest(`/products/${id}`, {
      method: "DELETE",
    }),
};


const CategoryAPI = {
  getAll: () => apiRequest("/categories"),

  create: (name) =>
    apiRequest("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  delete: (idOrName) =>
    apiRequest(`/categories/${encodeURIComponent(idOrName)}`, {
      method: "DELETE",
    }),
};


const SaleAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/sales${query ? `?${query}` : ""}`);
  },

  getByProduct: (productId) => apiRequest(`/sales/product/${productId}`),

  record: (sale) =>
    apiRequest("/sales", {
      method: "POST",
      body: JSON.stringify(sale),
    }),

  delete: (id) =>
    apiRequest(`/sales/${id}`, {
      method: "DELETE",
    }),
};


const ReorderAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/reorders${query ? `?${query}` : ""}`);
  },

  place: (reorder) =>
    apiRequest("/reorders", {
      method: "POST",
      body: JSON.stringify(reorder),
    }),

  updateStatus: (id, status, notes) =>
    apiRequest(`/reorders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status, notes }),
    }),

  delete: (id) =>
    apiRequest(`/reorders/${id}`, {
      method: "DELETE",
    }),
};


const AnalyticsAPI = {
  getDashboard: () => apiRequest("/analytics/dashboard"),
};
