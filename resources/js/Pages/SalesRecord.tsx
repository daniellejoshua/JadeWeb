import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { router, usePage } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';
import {
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Receipt,
    RotateCcw,
    Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDateTime } from '@/lib/format';

type SalesRecordRow = {
    id: number;
    order_id: string;
    sale_number: string | null;
    sale_date: string | null;
    customer_name: string | null;
    user_id: number | null;
    created_by: string | null;
    user_name: string | null;
    total_amount: number;
    amount_paid: number;
    change: number;
    discount_type: string | null;
    discount_amount: number;
    payment_method: string | null;
    reference: string | null;
    status: string | null;
    abort_reason: string | null;
};

type SalesFilters = {
    search: string;
    payment: string;
    status: string;
    date: string;
};

type SalesMeta = {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    from: number | null;
    to: number | null;
};

type SalesRecordProps = {
    sales: SalesRecordRow[];
    meta: SalesMeta;
    filters: SalesFilters;
};

type ReceiptItem = {
    id: number;
    product_name: string | null;
    product_code: string | null;
    unit: string | null;
    quantity: number;
    unit_price: number;
    original_unit_price: number | null;
    line_discount: number;
    sub_total: number;
};

type ReceiptPayload = {
    sale: SalesRecordRow & {
        customer_tin: string | null;
        discount_type: string | null;
    };
    items: ReceiptItem[];
    company: {
        company_name: string | null;
        tin: string | null;
        address: string | null;
        phone: string | null;
        email: string | null;
        website: string | null;
        logo_url: string | null;
        bir_auth_number: string | null;
        ptu_number: string | null;
        receipt_footer: string | null;
    } | null;
};

const JADE = {
    gold: '#BE9A30',
    border: '#E8E6E1',
    text: '#20242A',
    textSecondary: '#626873',
    textMuted: '#8A8F98',
    stockHealthy: '#2E9B45',
    stockCritical: '#E54832',
    paymentCash: '#1B873F',
    paymentCashBg: '#E7F4EA',
    paymentEwallet: '#1D63C4',
    paymentEwalletBg: '#E7F0FC',
    paymentCard: '#C26A12',
    paymentCardBg: '#FDF0E2',
};

type PaymentFilter = 'all' | 'cash' | 'ewallet' | 'card';
type StatusFilter = 'all' | 'completed' | 'aborted';

const paymentOptions: { value: PaymentFilter; label: string }[] = [
    { value: 'all', label: 'All Payments' },
    { value: 'cash', label: 'Cash' },
    { value: 'ewallet', label: 'E-Wallet' },
    { value: 'card', label: 'Card' },
];

const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'aborted', label: 'Aborted' },
];

function CellText({ text, className, maxLen = 12 }: { text: string; className?: string; maxLen?: number }) {
    const display = text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={cn('block whitespace-nowrap', className)}>{display}</span>
            </TooltipTrigger>
            <TooltipContent>{text}</TooltipContent>
        </Tooltip>
    );
}

const EWALLET_METHODS = ['gcash', 'maya'];

const MIN_VALUE_YEAR = 1;

const BUSINESS_TIMEZONE = 'Asia/Manila';

function isMinValueDate(value: string | null): boolean {
    if (!value) return true;

    const year = new Date(value).getUTCFullYear();
    return Number.isNaN(year) || year <= MIN_VALUE_YEAR;
}

function formatOrderDate(value: string | null): string {
    if (isMinValueDate(value)) return '';

    const parts = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: BUSINESS_TIMEZONE,
    }).formatToParts(new Date(value as string));

    const field = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? '';

    return `${field('day')}/${field('month')}/${field('year')} ${field('hour')}:${field('minute')}`;
}

function formatMoney(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '';

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function isZero(value: number | null | undefined): boolean {
    return value === null || value === undefined || Number.isNaN(value) || value === 0;
}

function isNoDiscountType(value: string | null): boolean {
    if (!value) return true;

    return ['none', 'no discount', 'nodiscount', '0', 'n/a'].includes(value.trim().toLowerCase());
}

function paymentTone(method: string | null) {
    const key = (method ?? '').trim().toLowerCase();

    if (key === 'cash') {
        return { label: method ?? '—', color: JADE.paymentCash, backgroundColor: JADE.paymentCashBg };
    }

    if (EWALLET_METHODS.includes(key)) {
        return { label: method ?? '—', color: JADE.paymentEwallet, backgroundColor: JADE.paymentEwalletBg };
    }

    if (key === 'card') {
        return { label: method ?? '—', color: JADE.paymentCard, backgroundColor: JADE.paymentCardBg };
    }

    return { label: method ?? '—', color: JADE.textSecondary, backgroundColor: '#F2F3F5' };
}

function PaymentBadge({ method }: { method: string | null }) {
    const tone = paymentTone(method);

    return (
        <span
            className="inline-flex h-5 items-center rounded-full px-2.5 text-xs font-medium"
            style={{ backgroundColor: tone.backgroundColor, color: tone.color }}
        >
            {tone.label}
        </span>
    );
}

function StatusBadge({ status }: { status: string | null }) {
    const aborted = (status ?? '').toLowerCase() === 'aborted';
    const label = aborted ? 'Aborted' : 'Completed';
    const style = aborted
        ? { backgroundColor: '#FDECEA', color: JADE.stockCritical }
        : { backgroundColor: '#E7F4EA', color: JADE.stockHealthy };
    return (
        <span className="inline-flex h-5 items-center rounded-full px-2.5 text-xs font-medium" style={style}>
            {label}
        </span>
    );
}

function PaginationControl({
    current,
    total,
    onChange,
    disabled,
}: {
    current: number;
    total: number;
    onChange: (page: number) => void;
    disabled: boolean;
}) {
    const arrowBase =
        'inline-flex size-8 items-center justify-center rounded-lg text-sm transition-colors disabled:pointer-events-none disabled:opacity-40';

    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                aria-label="First page"
                disabled={disabled || current === 1}
                onClick={() => onChange(1)}
                className={arrowBase}
                style={{ color: JADE.textSecondary }}
            >
                <ChevronFirst className="size-4" />
            </button>
            <button
                type="button"
                aria-label="Previous page"
                disabled={disabled || current === 1}
                onClick={() => onChange(Math.max(1, current - 1))}
                className={arrowBase}
                style={{ color: JADE.textSecondary }}
            >
                <ChevronLeft className="size-4" />
            </button>

            <span
                className="mx-2 flex size-8 items-center justify-center rounded-lg text-sm font-semibold"
                style={{ backgroundColor: JADE.gold, color: '#fff' }}
            >
                {current}
            </span>

            <button
                type="button"
                aria-label="Next page"
                disabled={disabled || current === total}
                onClick={() => onChange(Math.min(total, current + 1))}
                className={arrowBase}
                style={{ color: JADE.textSecondary }}
            >
                <ChevronRight className="size-4" />
            </button>
            <button
                type="button"
                aria-label="Last page"
                disabled={disabled || current === total}
                onClick={() => onChange(total)}
                className={arrowBase}
                style={{ color: JADE.textSecondary }}
            >
                <ChevronLast className="size-4" />
            </button>
        </div>
    );
}

function PageJump({
    current,
    total,
    onGo,
    disabled,
}: {
    current: number;
    total: number;
    onGo: (page: number) => void;
    disabled: boolean;
}) {
    const [value, setValue] = useState(String(current));
    const lastCommitted = useRef(current);

    useEffect(() => {
        setValue(String(current));
        lastCommitted.current = current;
    }, [current]);

    function commit() {
        const parsed = Number.parseInt(value, 10);

        if (Number.isNaN(parsed)) {
            setValue(String(current));
            return;
        }

        const target = Math.min(Math.max(parsed, 1), total);
        setValue(String(target));

        if (target !== current && target !== lastCommitted.current) {
            lastCommitted.current = target;
            onGo(target);
        }
    }

    return (
        <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
                e.preventDefault();
                commit();
            }}
        >
            <label htmlFor="sales-page-jump" className="text-xs" style={{ color: JADE.textSecondary }}>
                Page
            </label>
            <Input
                id="sales-page-jump"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setValue(String(current));
                        e.currentTarget.blur();
                    }
                }}
                disabled={disabled}
                inputMode="numeric"
                aria-label="Go to page"
                className="h-7 w-14 text-center text-xs"
                style={{ borderColor: JADE.border }}
            />
            <span className="text-xs" style={{ color: JADE.textSecondary }}>
                of {total}
            </span>
        </form>
    );
}

function ReceiptRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="flex items-baseline justify-between gap-4">
            <span className="text-xs" style={{ color: JADE.textSecondary }}>
                {label}
            </span>
            <span
                className={cn('text-sm tabular-nums', strong && 'font-semibold')}
                style={{ color: strong ? JADE.text : JADE.textSecondary }}
            >
                {value}
            </span>
        </div>
    );
}

function ReceiptDialog({
    open,
    loading,
    error,
    data,
    onOpenChange,
}: {
    open: boolean;
    loading: boolean;
    error: string | null;
    data: ReceiptPayload | null;
    onOpenChange: (open: boolean) => void;
}) {
    const company = data?.company;
    const sale = data?.sale;
    const items = data?.items ?? [];

    const subtotal = items.reduce((sum, i) => sum + i.sub_total, 0);
    const discount = sale?.discount_amount ?? 0;
    const total = sale?.total_amount ?? 0;
    const paid = sale?.amount_paid ?? 0;
    const change = Math.max(0, paid - total);
    const aborted = (sale?.status ?? '').toLowerCase() === 'aborted';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto p-0 sm:max-w-md">
                {loading && (
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
                        <Loader2 className="size-6 animate-spin" style={{ color: JADE.gold }} />
                        <p className="text-sm" style={{ color: JADE.textSecondary }}>
                            Loading receipt...
                        </p>
                    </div>
                )}

                {!loading && error && (
                    <div className="px-6 py-16 text-center">
                        <DialogHeader>
                            <DialogTitle>Receipt unavailable</DialogTitle>
                            <DialogDescription>{error}</DialogDescription>
                        </DialogHeader>
                    </div>
                )}

                {!loading && !error && sale && (
                    <>
                        <div
                            className="flex flex-col items-center gap-2 border-b px-6 py-5 text-center"
                            style={{ borderColor: JADE.border, backgroundColor: '#FBF7EA' }}
                        >
                            {company?.logo_url && (
                                <img
                                    src={company.logo_url}
                                    alt=""
                                    className="size-12 rounded-lg object-contain"
                                />
                            )}
                            <div>
                                <p className="text-base font-semibold" style={{ color: JADE.text }}>
                                    {company?.company_name ?? 'Sales Receipt'}
                                </p>
                                {company?.tin && (
                                    <p className="text-xs" style={{ color: JADE.textSecondary }}>
                                        TIN {company.tin}
                                    </p>
                                )}
                                {company?.address && (
                                    <p className="text-xs" style={{ color: JADE.textSecondary }}>
                                        {company.address}
                                    </p>
                                )}
                                {(company?.phone || company?.email) && (
                                    <p className="text-xs" style={{ color: JADE.textSecondary }}>
                                        {[company.phone, company.email].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                            </div>
                            {company?.bir_auth_number && (
                                <p className="text-[10px]" style={{ color: JADE.textMuted }}>
                                    ATP {company.bir_auth_number}
                                    {company.ptu_number ? ` · PTU ${company.ptu_number}` : ''}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 px-6 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: JADE.text }}>
                                        {sale.sale_number ?? sale.id}
                                    </p>
                                    <p className="text-xs" style={{ color: JADE.textMuted }}>
                                        {formatOrderDate(sale.sale_date)}
                                    </p>
                                </div>
                                <StatusBadge status={sale.status} />
                            </div>

                            <div
                                className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border px-3 py-2.5"
                                style={{ borderColor: JADE.border }}
                            >
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide" style={{ color: JADE.textMuted }}>
                                        Cashier
                                    </p>
                                    <p className="text-sm" style={{ color: JADE.text }}>
                                        {sale.user_name ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide" style={{ color: JADE.textMuted }}>
                                        Customer
                                    </p>
                                    <p className="truncate text-sm" style={{ color: JADE.text }}>
                                        {sale.customer_name ?? 'Walk-in'}
                                    </p>
                                    {sale.customer_tin && (
                                        <p className="text-xs" style={{ color: JADE.textMuted }}>
                                            TIN {sale.customer_tin}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {aborted && sale.abort_reason && (
                                <div
                                    className="rounded-lg px-3 py-2"
                                    style={{ backgroundColor: '#FDECEA', color: JADE.stockCritical }}
                                >
                                    <p className="text-xs font-semibold">Aborted</p>
                                    <p className="text-xs">{sale.abort_reason}</p>
                                </div>
                            )}

                            <div>
                                <p
                                    className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
                                    style={{ color: JADE.textMuted }}
                                >
                                    Items ({items.length})
                                </p>
                                <div className="flex flex-col">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start justify-between gap-3 border-b py-2 last:border-b-0"
                                            style={{ borderColor: JADE.border }}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm" style={{ color: JADE.text }}>
                                                    {item.product_name ?? 'Unknown product'}
                                                </p>
                                                <p className="text-xs" style={{ color: JADE.textMuted }}>
                                                    {item.quantity} {item.unit ?? 'pcs'} ×{' '}
                                                    {formatCurrency(item.unit_price)}
                                                    {item.line_discount > 0 && (
                                                        <span style={{ color: JADE.stockCritical }}>
                                                            {' '}
                                                            −{formatCurrency(item.line_discount)}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <p className="text-sm font-medium tabular-nums" style={{ color: JADE.text }}>
                                                {formatCurrency(item.sub_total)}
                                            </p>
                                        </div>
                                    ))}
                                    {items.length === 0 && (
                                        <p className="py-4 text-center text-sm" style={{ color: JADE.textMuted }}>
                                            No line items recorded.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <ReceiptRow label="Subtotal" value={formatCurrency(subtotal)} />
                                {discount > 0 && (
                                    <ReceiptRow
                                        label={`Discount${sale.discount_type ? ` (${sale.discount_type})` : ''}`}
                                        value={`−${formatCurrency(discount)}`}
                                    />
                                )}
                                <div className="mt-1 border-t pt-1.5" style={{ borderColor: JADE.border }}>
                                    <ReceiptRow label="Total" value={formatCurrency(total)} strong />
                                </div>
                                <ReceiptRow label="Amount Paid" value={formatCurrency(paid)} />
                                {change > 0 && <ReceiptRow label="Change" value={formatCurrency(change)} />}
                                <div className="flex items-center justify-between py-0.5">
                                    <span className="text-sm" style={{ color: JADE.textSecondary }}>
                                        Payment
                                    </span>
                                    <PaymentBadge method={sale.payment_method} />
                                </div>
                                {sale.reference && <ReceiptRow label="Reference" value={sale.reference} />}
                            </div>

                            {company?.receipt_footer && (
                                <div
                                    className="mt-1 border-t pt-3 text-center"
                                    style={{ borderColor: JADE.border }}
                                >
                                    {company.receipt_footer.split(/\r?\n/).map((line, i) => (
                                        <p key={i} className="text-xs whitespace-pre-line" style={{ color: JADE.textSecondary }}>
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SalesRecord() {
    const { sales, meta, filters } = usePage<PageProps & SalesRecordProps>().props;

    const [search, setSearch] = useState(filters.search);
    const [payment, setPayment] = useState<PaymentFilter>(filters.payment as PaymentFilter);
    const [status, setStatus] = useState<StatusFilter>(filters.status as StatusFilter);
    const [date, setDate] = useState(filters.date);

    const [receiptOpen, setReceiptOpen] = useState(false);
    const [receiptLoading, setReceiptLoading] = useState(false);
    const [receiptError, setReceiptError] = useState<string | null>(null);
    const [receiptData, setReceiptData] = useState<ReceiptPayload | null>(null);

    const isFirstRender = useRef(true);

    function navigate(next: Partial<SalesFilters> & { page?: number }) {
        const params = {
            search,
            payment,
            status,
            date,
            ...next,
        };

        router.get(
            route('sales'),
            Object.fromEntries(
                Object.entries(params).filter(([, value]) => value !== '' && value !== 'all')
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => navigate({ page: 1 }), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, payment, status, date]);

    function goToPage(page: number) {
        navigate({ page });
    }

    function resetFilters() {
        setSearch('');
        setPayment('all');
        setStatus('all');
        setDate('');
        router.get(route('sales'), {}, { preserveState: true, preserveScroll: true, replace: true });
    }

    async function openReceipt(id: number) {
        setReceiptOpen(true);
        setReceiptLoading(true);
        setReceiptError(null);
        setReceiptData(null);

        try {
            const response = await fetch(route('sales.receipt', id), {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error('This sales record could not be loaded.');
            }

            setReceiptData(await response.json());
        } catch (error) {
            setReceiptError(error instanceof Error ? error.message : 'Something went wrong.');
        } finally {
            setReceiptLoading(false);
        }
    }

    const emptyRows = Math.max(0, meta.perPage - sales.length);

    return (
        <SidebarLayout title="Sales Record" subtitle="Browse transactions from the LAN POS.">
            <div
                className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-white"
                style={{ borderColor: JADE.border }}
            >
                <div
                    className="flex flex-wrap items-end gap-3 border-b px-4 py-3"
                    style={{ borderColor: JADE.border }}
                >
                    <div className="flex min-w-56 flex-1 flex-col gap-1.5">
                        <span className="text-xs leading-none font-medium" style={{ color: JADE.textSecondary }}>
                            Search Record ID
                        </span>
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                                style={{ color: JADE.textMuted }}
                            />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search sale number or ID..."
                                className="pl-9"
                                style={{ borderColor: JADE.border }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs leading-none font-medium" style={{ color: JADE.textSecondary }}>
                            Payment
                        </span>
                        <Select value={payment} onValueChange={(v) => setPayment(v as PaymentFilter)}>
                            <SelectTrigger className="w-36" style={{ borderColor: JADE.border }}>
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs leading-none font-medium" style={{ color: JADE.textSecondary }}>
                            Status
                        </span>
                        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                            <SelectTrigger className="w-32" style={{ borderColor: JADE.border }}>
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs leading-none font-medium" style={{ color: JADE.textSecondary }}>
                            Date
                        </span>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-40"
                            style={{ borderColor: JADE.border }}
                        />
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        onClick={resetFilters}
                        className="bg-white text-sm font-medium"
                        style={{ borderColor: JADE.gold, color: JADE.gold }}
                    >
                        <RotateCcw className="size-3.5" />
                        Reset
                    </Button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full min-w-[1180px] text-sm">
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${JADE.border}` }}>
                                {[
                                    'Order ID',
                                    'Sale No',
                                    'Created By',
                                    'Order Date',
                                    'Payment Method',
                                    'Total Amount',
                                    'Total Received',
                                    'Change',
                                    'Discount Type',
                                    'Discount Amount',
                                ].map((header) => (
                                    <th
                                        key={header}
                                        className="px-4 py-2 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase"
                                        style={{ color: JADE.text }}
                                    >
                                        {header}
                                    </th>
                                ))}
                                <th
                                    className="px-4 py-2 text-left text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase"
                                    style={{ color: JADE.text }}
                                >
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => {
                                const hasDiscount =
                                    !isNoDiscountType(sale.discount_type) || !isZero(sale.discount_amount);

                                return (
                                    <tr
                                        key={sale.id}
                                        onClick={() => openReceipt(sale.id)}
                                        className="cursor-pointer transition-colors hover:bg-[#FBF7EA]"
                                        style={{ borderBottom: `1px solid ${JADE.border}` }}
                                    >
                                        <td className="px-4 py-2 font-medium tabular-nums" style={{ color: JADE.text }}>
                                            <CellText text={sale.order_id} maxLen={8} className="font-medium" />
                                        </td>
                                        <td className="px-4 py-2 tabular-nums" style={{ color: JADE.text }}>
                                            <CellText text={sale.sale_number ?? sale.id.toString()} maxLen={20} />
                                        </td>
                                        <td className="px-4 py-2" style={{ color: JADE.textSecondary }}>
                                            <CellText text={sale.created_by ?? '—'} maxLen={14} />
                                        </td>
                                        <td className="px-4 py-2 tabular-nums whitespace-nowrap" style={{ color: JADE.textSecondary }}>
                                            {formatOrderDate(sale.sale_date)}
                                        </td>
                                        <td className="px-4 py-2">
                                            <PaymentBadge method={sale.payment_method} />
                                        </td>
                                        <td
                                            className="px-4 py-2 text-right font-medium tabular-nums whitespace-nowrap"
                                            style={{ color: JADE.text }}
                                        >
                                            {formatMoney(sale.total_amount)}
                                        </td>
                                        <td
                                            className="px-4 py-2 text-right tabular-nums whitespace-nowrap"
                                            style={{ color: JADE.textSecondary }}
                                        >
                                            {formatMoney(sale.amount_paid)}
                                        </td>
                                        <td
                                            className="px-4 py-2 text-right tabular-nums whitespace-nowrap"
                                            style={{
                                                color:
                                                    sale.change > 0 ? JADE.stockHealthy : JADE.textSecondary,
                                            }}
                                        >
                                            {isZero(sale.change) ? '—' : formatMoney(sale.change)}
                                        </td>
                                        <td className="px-4 py-2" style={{ color: JADE.textSecondary }}>
                                            {hasDiscount ? (
                                                <CellText text={sale.discount_type ?? '—'} maxLen={12} />
                                            ) : (
                                                <span style={{ color: JADE.textMuted }}>—</span>
                                            )}
                                        </td>
                                        <td
                                            className="px-4 py-2 text-right tabular-nums whitespace-nowrap"
                                            style={{ color: JADE.textSecondary }}
                                        >
                                            {hasDiscount ? formatMoney(sale.discount_amount) : '—'}
                                        </td>
                                        <td className="px-4 py-2">
                                            <StatusBadge status={sale.status} />
                                        </td>
                                    </tr>
                                );
                            })}
                            {Array.from({ length: emptyRows }).map((_, i) => (
                                <tr key={`empty-${i}`} style={{ height: 44 }} aria-hidden="true">
                                    <td colSpan={11} />
                                </tr>
                            ))}
                            {sales.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="px-5 py-12 text-center text-sm" style={{ color: JADE.textMuted }}>
                                        No sales records match the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div
                    className="mt-auto flex shrink-0 flex-col gap-2.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    style={{ borderTop: `1px solid ${JADE.border}` }}
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs" style={{ color: JADE.textSecondary }}>
                            {meta.total === 0
                                ? 'No records'
                                : `Showing ${meta.from ?? 0} to ${meta.to ?? 0} of ${meta.total} records`}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <PageJump
                            current={meta.currentPage}
                            total={meta.lastPage}
                            onGo={goToPage}
                            disabled={meta.total === 0}
                        />
                        <PaginationControl
                            current={meta.currentPage}
                            total={meta.lastPage}
                            onChange={goToPage}
                            disabled={meta.total === 0}
                        />
                    </div>
                </div>
            </div>

            <ReceiptDialog
                open={receiptOpen}
                loading={receiptLoading}
                error={receiptError}
                data={receiptData}
                onOpenChange={setReceiptOpen}
            />
        </SidebarLayout>
    );
}

export default SalesRecord;
