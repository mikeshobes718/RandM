export function normalizePhone(value: string | null | undefined): string {
  return (value || '').replace(/\D+/g, '');
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
