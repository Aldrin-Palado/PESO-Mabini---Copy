export const PASSWORD_REQUIREMENTS_HELP_TEXT =
  "Use at least 8 characters, including an uppercase letter, a lowercase letter, a number, and a special character. Spaces are not allowed.";

export function getPasswordValidationError(password: string): string | null {
  if (password.length < 8) {
    return "Password must contain at least 8 characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!/[\p{P}\p{S}]/u.test(password)) {
    return "Password must contain at least one special character.";
  }
  if (/\s/.test(password)) {
    return "Password must not contain spaces.";
  }
  return null;
}
