// Requires a Gmail address specifically (case-insensitive on the domain,
// since email input is already lowercased before this pattern runs).
// Local part follows common Gmail rules: letters, digits, dots, plus and
// hyphen, cannot start/end with a dot.
const GMAIL_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@gmail\.com$/;

// Pakistani mobile number, exactly three accepted shapes:
//   +923214445566        (+92, no dashes, 10 digits)
//   03214445566          (0, no dashes, 10 digits after the 0)
//   +92-321-4445566       (+92, dashed as 3 digits - 7 digits)
// Nothing else (spaces, other country codes, parentheses, etc.) matches.
const PK_PHONE_PATTERN = /^(\+92\d{10}|0\d{10}|\+92-\d{3}-\d{7})$/;

module.exports = { GMAIL_PATTERN, PK_PHONE_PATTERN };