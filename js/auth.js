

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/;'`~]/;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordRuleFailures(password) {
  const failures = [];
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    failures.push(`At least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!PASSWORD_UPPERCASE_REGEX.test(password || "")) {
    failures.push("At least one uppercase letter");
  }
  if (!PASSWORD_SPECIAL_CHAR_REGEX.test(password || "")) {
    failures.push("At least one special character (e.g. ! @ # $ %)");
  }
  return failures;
}

function validateSignup(values) {
  const errors = {};

  if (!values.name || values.name.trim() === "") {
    errors.name = "Name is required.";
  }

  if (!values.email || values.email.trim() === "") {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  const passwordFailures = getPasswordRuleFailures(values.password);
  if (passwordFailures.length > 0) {
    errors.password = `Password must include: ${passwordFailures.join(", ")}.`;
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}


async function signupUser(values) {
  const res = await AuthAPI.register(values.name, values.email, values.password);
  if (!res || !res.user) {
    throw new Error(res?.error || "Registration failed in MongoDB Atlas");
  }
  return res.user;
}

function validateLogin(values) {
  const errors = {};
  if (!values.email || values.email.trim() === "") errors.email = "Email is required.";
  if (!values.password || values.password === "") errors.password = "Password is required.";
  return { isValid: Object.keys(errors).length === 0, errors };
}


async function loginUser(values) {
  const res = await AuthAPI.login(values.email, values.password);
  if (!res || !res.user) {
    throw new Error(res?.error || "Invalid email or password");
  }

  const sessionUser = {
    id: res.user.id || res.user._id,
    name: res.user.name,
    email: res.user.email,
  };
  setCurrentUser(sessionUser);

  return sessionUser;
}

const SESSION_USER_KEY = "currentUser";


(function clearAnyLegacyStorage() {
  try {
    const keys = ["currentUser", "token", "products", "sales", "categories", "reorders", "users"];
    keys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
})();


function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}


function setCurrentUser(user) {
  try {
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  } catch (err) {}
}


function clearCurrentUser() {
  try {
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem("token");
    localStorage.clear();
  } catch (err) {}
}

function logoutUser() {
  clearCurrentUser();
  window.location.href = "login.html";
}

function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = "login.html";
  }
}

function redirectIfLoggedIn() {
  if (getCurrentUser()) {
    window.location.href = "dashboard.html";
  }
}
