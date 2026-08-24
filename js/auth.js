/* =========================================================
   auth.js
   -----------------------------------------------------------
   Handles user accounts and login sessions.

   IMPORTANT (viva note): there is no server here, so there is
   no truly secure way to store passwords — real applications
   hash passwords with a strong algorithm (e.g. bcrypt) ON THE
   SERVER, never in client-side JavaScript. Since this project
   is scoped to vanilla JS + localStorage only, we run passwords
   through a simple one-way hash function below purely so we
   are not saving them as plain readable text. This is a
   classroom-level demonstration of the CONCEPT of hashing, not
   production-grade security.
========================================================= */

// Password rule: at least 8 characters, at least one uppercase
// letter, and at least one special character.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/;'`~]/;

/**
 * A small, dependency-free hash function (djb2 algorithm).
 * Turns any string into a fixed-length string of digits.
 * Same input always produces the same output, but you can't
 * reverse it back into the original password.
 */
function simpleHash(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  // Convert to an unsigned number, then to a string
  return (hash >>> 0).toString();
}

/**
 * Basic email format check using a regular expression.
 * Not exhaustive (real validation is done server-side normally),
 * just enough to catch obvious typos like "abc@" or "abc.com".
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Checks a password against every rule and returns a list of
 * which rules are NOT yet satisfied. Used both for final
 * validation on submit, and for the live checklist shown while
 * the user types on the signup page.
 */
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

/**
 * Validates the signup form values.
 */
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

/**
 * Creates a new user account. Does NOT log the user in —
 * after signing up, the user is sent to the login page and
 * must log in with their new credentials, same as most
 * real-world signup flows ("account created, please log in").
 * Returns the newly created user (without the password field).
 */
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

/**
 * Validates the login form values (presence only —
 * whether the credentials actually match is checked separately).
 */
function validateLogin(values) {
  const errors = {};
  if (!values.email || values.email.trim() === "") errors.email = "Email is required.";
  if (!values.password || values.password === "") errors.password = "Password is required.";
  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Checks the given email/password against stored users.
 * Returns the matching user (without password) if credentials
 * are correct, or null if they're wrong.
 */
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

/**
 * Logs the current user out and sends them back to the login page.
 */
function logoutUser() {
  clearCurrentUser();
  window.location.href = "index.html";
}

/**
 * "Auth guard" for protected pages (like the dashboard).
 * If nobody is logged in, redirect to login.html immediately.
 * Called from dashboard.html BEFORE the page body is shown.
 */
function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = "login.html";
  }
}

/**
 * Used on login.html/signup.html — if someone is already logged
 * in and lands on these pages, send them straight to the dashboard
 * instead of showing the login form again.
 */
function redirectIfLoggedIn() {
  if (getCurrentUser()) {
    window.location.href = "dashboard.html";
  }
}
