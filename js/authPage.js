
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
    showSignupSuccessMessageIfPresent();
  }

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignupSubmit);
    attachPasswordChecklist();
  }


  document.querySelectorAll(".toggle-password-btn").forEach((btn) => {
    btn.addEventListener("click", handleTogglePassword);
  });
});


function handleLoginSubmit(e) {
  e.preventDefault();

  const values = {
    email: document.getElementById("loginEmail").value,
    password: document.getElementById("loginPassword").value,
  };

  clearAuthErrors();

  const { isValid, errors } = validateLogin(values);
  if (!isValid) {
    displayAuthErrors(errors);
    return;
  }

  const user = loginUser(values);
  if (!user) {
    document.getElementById("loginFormError").textContent =
      "Incorrect email or password. Please try again.";
    return;
  }

  window.location.href = "dashboard.html";
}


function showSignupSuccessMessageIfPresent() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("signup") === "success") {
    const banner = document.getElementById("loginFormError");
    banner.textContent = "Account created successfully. Please log in.";
    banner.classList.add("form-success-text");
  }
}



function handleSignupSubmit(e) {
  e.preventDefault();

  const values = {
    name: document.getElementById("signupName").value,
    email: document.getElementById("signupEmail").value,
    password: document.getElementById("signupPassword").value,
    confirmPassword: document.getElementById("signupConfirmPassword").value,
  };

  clearAuthErrors();

  const { isValid, errors } = validateSignup(values);
  if (!isValid) {
    displayAuthErrors(errors);
    return;
  }

  signupUser(values);


  window.location.href = "login.html?signup=success";
}


function attachPasswordChecklist() {
  const passwordInput = document.getElementById("signupPassword");
  const checklistBox = document.getElementById("passwordChecklist");
  if (!passwordInput || !checklistBox) return;

  const rules = [
    { id: "ruleLength", label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (pw) => pw.length >= PASSWORD_MIN_LENGTH },
    { id: "ruleUppercase", label: "At least one uppercase letter", test: (pw) => PASSWORD_UPPERCASE_REGEX.test(pw) },
    { id: "ruleSpecial", label: "At least one special character", test: (pw) => PASSWORD_SPECIAL_CHAR_REGEX.test(pw) },
  ];

  passwordInput.addEventListener("input", () => {
    const password = passwordInput.value;
    rules.forEach((rule) => {
      const li = document.getElementById(rule.id);
      if (!li) return;
      const passed = rule.test(password);
      li.classList.toggle("rule-passed", passed);
      li.classList.toggle("rule-failed", !passed);
      li.textContent = (passed ? "✓ " : "✗ ") + rule.label;
    });
  });
}


function handleTogglePassword(e) {
  const button = e.currentTarget;
  const targetId = button.dataset.target;
  const input = document.getElementById(targetId);
  if (!input) return;

  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  button.textContent = isHidden ? "🙈" : "👁️";
  button.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
}

function clearAuthErrors() {
  document.querySelectorAll(".error-text").forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".form-group input").forEach((el) => el.classList.remove("input-error"));
  const formError = document.getElementById("loginFormError") || document.getElementById("signupFormError");
  if (formError) {
    formError.textContent = "";
    formError.classList.remove("form-success-text");
  }
}

function displayAuthErrors(errors) {
  Object.keys(errors).forEach((key) => {
 
    const input = document.querySelector(`[data-field="${key}"]`);
    if (!input) return;
    const errorSpan = document.getElementById(`err-${input.id}`);
    if (errorSpan) errorSpan.textContent = errors[key];
    input.classList.add("input-error");
  });
}
