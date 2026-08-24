/* =========================================================
   landing.js
   -----------------------------------------------------------
   Only runs on the landing page (index.html). The landing page
   is public — unlike dashboard.html it has NO requireAuth()
   guard — but if someone visiting it already has an active
   session, showing "Log In / Sign Up" again would be confusing.
   This swaps those buttons for a single "Go to Dashboard" button
   instead, and adds a small "Welcome back" line under the hero.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  if (!user) return; // nobody logged in — leave the default Log In / Sign Up buttons as-is

  const dashboardCtaHtml = `<a href="dashboard.html" class="btn btn-primary">Go to Dashboard</a>`;
  const dashboardCtaHtmlLg = `<a href="dashboard.html" class="btn btn-primary btn-lg">Go to Dashboard</a>`;

  const navActions = document.getElementById("landingNavActions");
  if (navActions) navActions.innerHTML = dashboardCtaHtml;

  const heroActions = document.getElementById("landingHeroActions");
  if (heroActions) heroActions.innerHTML = dashboardCtaHtmlLg;

  const finalCta = document.getElementById("landingFinalCta");
  if (finalCta) {
    finalCta.textContent = "Go to Dashboard";
    finalCta.href = "dashboard.html";
  }

  const welcomeBack = document.getElementById("landingWelcomeBack");
  if (welcomeBack) {
    welcomeBack.textContent = `Welcome back, ${user.name} — pick up right where you left off.`;
    welcomeBack.classList.remove("hidden");
  }
});
