const passwordField = document.querySelector("#password-input");
const visibilityToggle = document.querySelector(".password-visibility");
const resetButton = document.querySelector(".reset-password");

function updateVisibilityState(isVisible) {
  if (!passwordField || !visibilityToggle) {
    return;
  }

  const newType = isVisible ? "text" : "password";
  passwordField.type = newType;
  visibilityToggle.setAttribute("aria-pressed", String(isVisible));
  visibilityToggle.dataset.visibility = isVisible ? "visible" : "hidden";
  visibilityToggle.setAttribute(
    "aria-label",
    isVisible ? "Hide password" : "Show password"
  );
}

if (visibilityToggle && passwordField) {
  visibilityToggle.addEventListener("click", () => {
    const isVisible = visibilityToggle.dataset.visibility !== "visible";
    updateVisibilityState(isVisible);
    passwordField.focus();
  });
}

if (resetButton && passwordField) {
  resetButton.addEventListener("click", () => {
    passwordField.value = "";
    updateVisibilityState(false);
    passwordField.focus();
  });
}

updateVisibilityState(false);
