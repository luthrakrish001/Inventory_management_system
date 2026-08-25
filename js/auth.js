
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/;'`~]/;


function simpleHash(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  // Convert to an unsigned number, then to a string
  return (hash >>> 0).toString();
}


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
  } else {
    const existing = getUsers().find(
      (u) => u && typeof u.email === 'string' && u.email.toLowerCase() === values.email.trim().toLowerCase()
    );
    if (existing) errors.email = "An account with this email already exists.";
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

function signupUser(values) {
  const users = getUsers();

  const newUser = {
    id: generateId("u"),
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    password: simpleHash(values.password), // never store the raw password
  };

  saveUsers([...users, newUser]);

  return { id: newUser.id, name: newUser.name, email: newUser.email };
}

function validateLogin(values) {
  const errors = {};
  if (!values.email || values.email.trim() === "") errors.email = "Email is required.";
  if (!values.password || values.password === "") errors.password = "Password is required.";
  return { isValid: Object.keys(errors).length === 0, errors };
}

function loginUser(values) {
  const users = getUsers();
  const hashedInput = simpleHash(values.password);

  const match = users.find(
    (u) =>
      u.email.toLowerCase() === values.email.trim().toLowerCase() &&
      u.password === hashedInput
  );

  if (!match) return null;

  const sessionUser = { id: match.id, name: match.name, email: match.email };
  setCurrentUser(sessionUser);
  return sessionUser;
}

function logoutUser() {
  clearCurrentUser();
  window.location.href = "index.html";
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
