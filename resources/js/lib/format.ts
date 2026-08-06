export function formatCurrency(value: number, currency = 'PHP'): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency,
        maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
}

export function formatCompactCurrency(value: number, currency = 'PHP', threshold = 1_000_000): string {
    if (Math.abs(value) < threshold) return formatCurrency(value, currency);
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

export function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-PH').format(value);
}

export function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(iso));
}

export function initials(name: string | null | undefined): string {
    if (!name) return '?';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}
