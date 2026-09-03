// Mirrors the backend's Joi + PostgreSQL CHECK constraint: user account
// emails must be @gmail.com addresses.
export const GMAIL_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@gmail\.com$/;

export const isGmailAddress = (email) => GMAIL_PATTERN.test((email || '').trim());
