export function normalizePhone(phone) {
    const s = String(phone || '').trim();
    const hasPlus = s.startsWith('+');
    const digits = s.replace(/\D/g, '');
    return hasPlus ? '+' + digits : digits;
}

export function formatDate(value) {
    if (!value) return 'No date';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'No date';
    return d.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'});
}
