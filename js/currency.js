/* =========================================================
   currency.js
   -----------------------------------------------------------
   The one place in the app that talks to an external REST API
   (everything else only reads/writes localStorage). Uses the
   Fetch API + async/await to pull a live INR -> USD exchange
   rate, so the "Inventory Value" stat card can show a real-time
   USD estimate alongside the ₹ total.

   API used: exchangerate-api.com's free "open" endpoint —
   no API key required, returns JSON like:
     { "base": "INR", "rates": { "USD": 0.012, ... }, ... }
========================================================= */

const EXCHANGE_RATE_API_URL = "https://open.er-api.com/v6/latest/INR";

// Cache the rate for this page session so we don't refetch on
// every single dashboard re-render (add/edit/delete/sale all
// call renderDashboard()) — just once per page load.
let cachedInrToUsdRate = null;

/**
 * Fetches the current INR -> USD exchange rate.
 * Returns a number (e.g. 0.012) on success, or null if the
 * request fails — callers are responsible for handling that
 * gracefully instead of crashing the whole dashboard.
 */
async function fetchInrToUsdRate() {
  if (cachedInrToUsdRate !== null) return cachedInrToUsdRate;

  try {
    const response = await fetch(EXCHANGE_RATE_API_URL);

    if (!response.ok) {
      throw new Error(`Exchange rate request failed with status ${response.status}`);
    }

    const data = await response.json();
    const rate = data && data.rates ? data.rates.USD : undefined;

    if (typeof rate !== "number") {
      throw new Error("USD rate missing from API response.");
    }

    cachedInrToUsdRate = rate;
    return rate;
  } catch (err) {
    console.error("Could not fetch live exchange rate:", err);
    return null;
  }
}

/**
 * Fetches the live rate, converts the given INR amount, and
 * writes the formatted result into the USD stat sub-value.
 * Called from ui.js after every render. Deliberately async and
 * separate from the synchronous renderStats() — the ₹ total
 * should appear instantly, and the $ estimate can pop in a
 * moment later once the network request resolves.
 */
async function renderInventoryValueInUsd(totalInrValue) {
  const usdEl = document.getElementById("statInventoryValueUsd");
  if (!usdEl) return;

  usdEl.textContent = "Fetching live USD rate…";

  const rate = await fetchInrToUsdRate();

  if (rate === null) {
    usdEl.textContent = "USD rate unavailable right now";
    return;
  }

  const usdValue = totalInrValue * rate;
  usdEl.textContent = `≈ $${usdValue.toFixed(2)} USD`;
}
