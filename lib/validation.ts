export function isValidEmail(email: string): boolean {
  const value = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 120;
}

/** Australian mobiles, landlines, 13/1300/1800, and +61 forms. */
export function isValidAuPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  if (/^61[2-478]\d{8}$/.test(digits)) return true;
  if (/^0[2-478]\d{8}$/.test(digits)) return true;
  if (/^[2-478]\d{8}$/.test(digits)) return true;
  if (/^1[38]00\d{6}$/.test(digits)) return true;
  if (/^13\d{4}$/.test(digits)) return true;
  return false;
}

export function isValidPersonName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 80 && /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(trimmed);
}

export interface ContactErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export function validateContact(details: { name: string; email: string; phone: string }): ContactErrors {
  const errors: ContactErrors = {};
  if (!isValidPersonName(details.name)) {
    errors.name = 'Please tell us your name (at least 2 letters).';
  }
  if (!isValidEmail(details.email)) {
    errors.email = 'That email doesn’t look quite right. Try again?';
  }
  if (!isValidAuPhone(details.phone)) {
    errors.phone = 'Please enter an Australian mobile or landline so we can call you.';
  }
  return errors;
}

export function isContactValid(details: { name: string; email: string; phone: string }): boolean {
  return Object.keys(validateContact(details)).length === 0;
}
