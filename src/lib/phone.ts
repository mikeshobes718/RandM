export function normalizePhone(value: string | null | undefined): string {
  let digits = (value || '').replace(/\D+/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }
  return digits;
}

export function formatPhone(value: string | null | undefined): string {
  const digits = normalizePhone(value).slice(0, 10);
  if (!digits) return '';
  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const line = digits.slice(6, 10);
  let formatted = '';
  if (digits.length <= 3) {
    formatted = `(${area}`;
  } else if (digits.length <= 6) {
    formatted = `(${area}) ${digits.slice(3)}`;
  } else {
    formatted = `(${area}) ${prefix}-${line}`;
  }
  if (digits.length > 10) {
    formatted += ` x${digits.slice(10)}`;
  }
  return formatted.trim();
}

export function formatPhoneForInput(value: string): string {
  return formatPhone(value);
}

export function formatToE164(phone: string): string {
  // Strip everything but digits
  let digits = phone.replace(/\D+/g, '');
  if (digits.length === 10) {
    return '+1' + digits;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return '+' + digits;
  }
  if (phone.startsWith('+')) {
    return '+' + digits;
  }
  return '+' + digits; // Fallback
}
