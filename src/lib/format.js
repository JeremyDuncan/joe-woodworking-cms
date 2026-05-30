export function normalizePhone(phone) {
    return String(phone || '').replace(/[^+\d]/g, '');
}

export function formatDate(value) {
    if (!value) return 'No date';
    try {
        return new Date(value).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'});
    } catch {
        return 'No date';
    }
}
