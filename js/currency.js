
const EXCHANGE_RATE_API_URL = "https://open.er-api.com/v6/latest/INR";

let cachedInrToUsdRate = null;

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
