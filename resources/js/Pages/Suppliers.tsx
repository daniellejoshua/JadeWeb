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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { router, usePage } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';
import {
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
    Download,
    Loader2,
    RotateCcw,
    Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type SupplierRow = {
    id: number;
    supplier_code: string | null;
    supplier_name: string | null;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    is_active: boolean;
    stock_in_count: number;
};

type StockInRow = {
    id: number;
    product_name: string;
    quantity: number;
    reference: string;
    created_at: string | null;
};

type SupplierDetail = {
    supplier: SupplierRow;
    stockIns: StockInRow[];
    stockInMeta: SupplierMeta;
    stockInFilters: {
        date: string;
        reference: string;
    };
};

type SupplierFilters = {
    search: string;
    status: string;
};

type SupplierMeta = {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    from: number | null;
    to: number | null;
};

type SuppliersProps = {
    suppliers: SupplierRow[];
    meta: SupplierMeta;
    filters: SupplierFilters;
};

const JADE = {
    gold: '#BE9A30',
    border: '#E8E6E1',
    text: '#20242A',
    textSecondary: '#626873',
    textMuted: '#8A8F98',
    stockHealthy: '#2E9B45',
    stockCritical: '#E54832',
};

type StatusFilter = 'all' | 'active' | 'inactive';

const BUSINESS_TIMEZONE = 'Asia/Manila';
const MIN_VALUE_YEAR = 1;

function formatOrderDate(value: string | null): string {
    if (!value) return '';

    const date = new Date(value);
    const year = date.getUTCFullYear();
    if (Number.isNaN(year) || year <= MIN_VALUE_YEAR) return '';

    const parts = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: BUSINESS_TIMEZONE,
    }).formatToParts(date);

    const field = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? '';

    return `${field('day')}/${field('month')}/${field('year')} ${field('hour')}:${field('minute')}`;
}

function csvCell(value: string | number | null | undefined): string {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadStockInsCsv(code: string, stockIns: StockInRow[]): void {
    const header = ['Date', 'Product', 'Quantity', 'Reference'];
    const lines = stockIns.map((log) =>
        [
            formatOrderDate(log.created_at),
            log.product_name,
            log.quantity,
            log.reference,
        ]
            .map(csvCell)
            .join(','),
    );

    const stamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);
    const filename = `Supplier_${code || 'unknown'}_StockIns_${stamp}.csv`;

    const blob = new Blob([[header.join(','), ...lines].join('\r\n')], {
        type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

function CellText({ text, className, maxLen = 14 }: { text: string; className?: string; maxLen?: number }) {
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

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className="inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold"
            style={{
                backgroundColor: active ? '#E7F4EA' : '#F2F3F5',
                color: active ? JADE.stockHealthy : JADE.textSecondary,
            }}
        >
            {active ? 'Active' : 'Inactive'}
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

    const arrowStyle = { border: `1px solid ${JADE.border}`, color: JADE.textSecondary };

    return (
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                onClick={() => onChange(1)}
                disabled={disabled || current === 1}
                className={cn(arrowBase, 'border')}
                style={arrowStyle}
                aria-label="First page"
            >
                <ChevronFirst className="size-4" />
            </button>
            <button
                type="button"
                onClick={() => onChange(current - 1)}
                disabled={disabled || current === 1}
                className={cn(arrowBase, 'border')}
                style={arrowStyle}
                aria-label="Previous page"
            >
                <ChevronLeft className="size-4" />
            </button>
            <span className="px-1 text-xs tabular-nums" style={{ color: JADE.textSecondary }}>
                Page {current} of {total}
            </span>
            <button
                type="button"
                onClick={() => onChange(current + 1)}
                disabled={disabled || current === total}
                className={cn(arrowBase, 'border')}
                style={arrowStyle}
                aria-label="Next page"
            >
                <ChevronRight className="size-4" />
            </button>
            <button
                type="button"
                onClick={() => onChange(total)}
                disabled={disabled || current === total}
                className={cn(arrowBase, 'border')}
                style={arrowStyle}
                aria-label="Last page"
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
            <label htmlFor="supplier-page-jump" className="text-xs" style={{ color: JADE.textSecondary }}>
                Page
            </label>
            <Input
                id="supplier-page-jump"
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

function Suppliers() {
    const { suppliers, meta, filters } = usePage<PageProps & SuppliersProps>().props;

    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState<StatusFilter>(filters.status as StatusFilter);
    const isFirstRender = useRef(true);

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [detail, setDetail] = useState<SupplierDetail | null>(null);
    const [detailSupplierId, setDetailSupplierId] = useState<number | null>(null);
    const [stockInDate, setStockInDate] = useState('');
    const [stockInReference, setStockInReference] = useState('');

    async function loadDetail(id: number, date: string, reference: string, page = 1) {
        setDetailLoading(true);
        setDetailError(null);

        try {
            const params: Record<string, string | number> = { id, page };
            if (date) params.date = date;
            if (reference.trim()) params.reference = reference.trim();

            const response = await fetch(route('suppliers.detail', params), {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error('This supplier could not be loaded.');
            }

            setDetail(await response.json());
        } catch (error) {
            setDetailError(error instanceof Error ? error.message : 'Something went wrong.');
        } finally {
            setDetailLoading(false);
        }
    }

    function openDetail(id: number) {
        setDetailSupplierId(id);
        setStockInDate('');
        setStockInReference('');
        setDetail(null);
        setDetailOpen(true);
        void loadDetail(id, '', '');
    }

    function filterStockIns(page = 1) {
        if (detailSupplierId === null) return;
        void loadDetail(detailSupplierId, stockInDate, stockInReference, page);
    }

    function resetStockInFilters() {
        if (detailSupplierId === null) return;
        setStockInDate('');
        setStockInReference('');
        void loadDetail(detailSupplierId, '', '', 1);
    }

    function navigate(next: Partial<SupplierFilters> & { page?: number }) {
        const params = {
            search,
            status,
            ...next,
        };

        router.get(
            route('suppliers'),
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

        const timer = setTimeout(() => navigate({ page: 1 }), 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status]);

    function goToPage(page: number) {
        navigate({ page });
    }

    function resetFilters() {
        setSearch('');
        setStatus('all');
        router.get(route('suppliers'), {}, { preserveState: true, preserveScroll: true, replace: true });
    }

    const emptyRows = Math.max(0, meta.perPage - suppliers.length);

    return (
        <SidebarLayout title="Suppliers" subtitle="Browse suppliers synced from the LAN POS.">
            <div
                className="flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden rounded-xl border bg-white"
                style={{ borderColor: JADE.border }}
            >
                <div
                    className="flex flex-wrap items-center gap-2.5 border-b bg-[#FCFBF8] px-4 py-3"
                    style={{ borderColor: JADE.border }}
                >
                    <div className="min-w-56 flex-1 sm:max-w-lg">
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                                style={{ color: JADE.textMuted }}
                            />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search supplier, contact, or code..."
                                className="bg-white pl-9"
                                style={{ borderColor: JADE.border }}
                            />
                        </div>
                    </div>

                    <div>
                        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                            <SelectTrigger className="w-36 bg-white" style={{ borderColor: JADE.border }}>
                                <SelectValue placeholder="All Status" />
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

                    <Button
                        variant="outline"
                        type="button"
                        onClick={resetFilters}
                        className="bg-white text-xs font-medium"
                        style={{ borderColor: JADE.gold, color: JADE.gold }}
                    >
                        <RotateCcw className="size-3.5" />
                        Reset
                    </Button>
                </div>

                <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
                    <table className="w-full min-w-[780px] table-fixed text-xs xl:min-w-0">
                        <colgroup>
                            <col className="w-[7%]" />
                            <col className="w-[11%]" />
                            <col className="w-[21%]" />
                            <col className="w-[17%]" />
                            <col className="w-[14%]" />
                            <col className="w-[19%]" />
                            <col className="w-[7%]" />
                            <col className="w-[4%]" />
                        </colgroup>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${JADE.border}` }}>
                                {['ID', 'Code', 'Supplier', 'Contact', 'Phone', 'Email', 'Status', 'Ins'].map((header) => (
                                    <th
                                        key={header}
                                        className={cn('truncate px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide', header === 'Ins' && 'text-center')}
                                        style={{ color: JADE.text }}
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((supplier) => (
                                <tr
                                    key={supplier.id}
                                    className="cursor-pointer transition-colors hover:bg-[#FBF7EA] focus-visible:bg-[#FBF7EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#BE9A30]"
                                    style={{ borderBottom: `1px solid ${JADE.border}` }}
                                    onClick={() => openDetail(supplier.id)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            openDetail(supplier.id);
                                        }
                                    }}
                                    tabIndex={0}
                                    aria-label={`View ${supplier.supplier_name ?? 'supplier'} details`}
                                >
                                    <td className="truncate px-2.5 py-2 tabular-nums" style={{ color: JADE.textSecondary }}>
                                        {supplier.id}
                                    </td>
                                    <td className="truncate px-2.5 py-2 tabular-nums" style={{ color: JADE.textSecondary }}>
                                        <CellText text={supplier.supplier_code ?? '—'} maxLen={10} />
                                    </td>
                                    <td className="min-w-0 px-2.5 py-2 font-medium" style={{ color: JADE.text }}>
                                        <CellText
                                            text={supplier.supplier_name ?? '—'}
                                            maxLen={28}
                                            className="font-semibold"
                                        />
                                    </td>
                                    <td className="min-w-0 px-2.5 py-2" style={{ color: JADE.textSecondary }}>
                                        <CellText text={supplier.contact_person ?? '—'} maxLen={18} />
                                    </td>
                                    <td className="min-w-0 px-2.5 py-2 tabular-nums" style={{ color: JADE.textSecondary }}>
                                        <CellText text={supplier.phone ?? '—'} maxLen={16} />
                                    </td>
                                    <td className="min-w-0 px-2.5 py-2" style={{ color: JADE.textSecondary }}>
                                        <CellText text={supplier.email ?? '—'} maxLen={24} />
                                    </td>
                                    <td className="overflow-hidden px-2.5 py-2">
                                        <StatusBadge active={supplier.is_active} />
                                    </td>
                                    <td
                                        className="px-2.5 py-2 text-center font-semibold tabular-nums"
                                        style={{ color: JADE.text }}
                                    >
                                        {supplier.stock_in_count}
                                    </td>
                                </tr>
                            ))}
                            {Array.from({ length: emptyRows }).map((_, i) => (
                                <tr key={`empty-${i}`} style={{ height: 44 }} aria-hidden="true">
                                    <td colSpan={8} />
                                </tr>
                            ))}
                            {suppliers.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-12 text-center text-sm"
                                        style={{ color: JADE.textMuted }}
                                    >
                                        No suppliers match the current filters.
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
                    <span className="text-xs" style={{ color: JADE.textSecondary }}>
                        {meta.total === 0
                            ? 'No records'
                            : `Showing ${meta.from ?? 0} to ${meta.to ?? 0} of ${meta.total} suppliers`}
                    </span>

                    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
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

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle style={{ color: JADE.gold }}>
                            Supplier Details{detail?.supplier.supplier_name
                                ? ` — ${detail.supplier.supplier_name}`
                                : ''}
                        </DialogTitle>
                        <DialogDescription>
                            Read-only supplier information and recent stock-in history.
                        </DialogDescription>
                    </DialogHeader>

                    {detailLoading && !detail && (
                        <div className="flex items-center justify-center gap-2 py-16">
                            <Loader2 className="size-4 animate-spin" style={{ color: JADE.gold }} />
                            <p className="text-sm" style={{ color: JADE.textSecondary }}>
                                Loading supplier...
                            </p>
                        </div>
                    )}

                    {!detailLoading && detailError && !detail && (
                        <div className="py-16 text-center">
                            <DialogHeader>
                                <DialogTitle>Supplier unavailable</DialogTitle>
                                <DialogDescription>{detailError}</DialogDescription>
                            </DialogHeader>
                        </div>
                    )}

                    {detail && (
                        <div className="flex flex-col gap-4">
                            <section className="overflow-hidden rounded-xl bg-[#20242A] text-white">
                                <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#FEBF10]">
                                                {detail.supplier.supplier_code || `Supplier ${detail.supplier.id}`}
                                            </span>
                                            <StatusBadge active={detail.supplier.is_active} />
                                        </div>
                                        <h3 className="mt-3 truncate text-xl font-semibold">
                                            {detail.supplier.supplier_name || 'Unnamed supplier'}
                                        </h3>
                                        <p className="mt-1 text-sm text-white/65">
                                            Contact: {detail.supplier.contact_person || 'Not provided'}
                                        </p>
                                        <div className="mt-4 grid gap-2 text-xs text-white/75 sm:grid-cols-2">
                                            <div className="truncate rounded-lg bg-white/5 px-3 py-2" title={detail.supplier.phone || undefined}>
                                                <span className="mr-2 text-white/45">Phone</span>{detail.supplier.phone || '—'}
                                            </div>
                                            <div className="truncate rounded-lg bg-white/5 px-3 py-2" title={detail.supplier.email || undefined}>
                                                <span className="mr-2 text-white/45">Email</span>{detail.supplier.email || '—'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center">
                                        <div className="text-3xl font-semibold tabular-nums text-[#FEBF10]">{detail.supplier.stock_in_count}</div>
                                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/55">Total Stock-Ins</div>
                                    </div>
                                </div>
                            </section>

                            <section className="flex min-w-0 flex-col gap-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-sm font-semibold" style={{ color: JADE.text }}>Stock-In History</h3>
                                        <p className="text-xs" style={{ color: JADE.textMuted }}>
                                            {detail.stockInMeta.total === 0
                                                ? 'No matching records'
                                                : `Showing ${detail.stockInMeta.from}–${detail.stockInMeta.to} of ${detail.stockInMeta.total}`}
                                        </p>
                                    </div>
                                    {detailLoading && <Loader2 className="size-4 animate-spin" style={{ color: JADE.gold }} />}
                                </div>

                                <form
                                    className="grid gap-2 rounded-lg border bg-[#FCFBF8] p-3 sm:grid-cols-[170px_minmax(200px,1fr)_auto_auto]"
                                    style={{ borderColor: JADE.border }}
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        filterStockIns();
                                    }}
                                >
                                    <Input
                                        type="date"
                                        value={stockInDate}
                                        onChange={(event) => setStockInDate(event.target.value)}
                                        aria-label="Filter stock-ins by date"
                                        className="bg-white"
                                        style={{ borderColor: JADE.border }}
                                    />
                                    <Input
                                        value={stockInReference}
                                        onChange={(event) => setStockInReference(event.target.value)}
                                        placeholder="Filter by reference..."
                                        aria-label="Filter stock-ins by reference"
                                        className="bg-white"
                                        style={{ borderColor: JADE.border }}
                                    />
                                    <Button type="submit" disabled={detailLoading} className="bg-[#BE9A30] text-white hover:bg-[#9D7E25]">Apply</Button>
                                    <Button type="button" variant="outline" disabled={detailLoading} onClick={resetStockInFilters}>Reset</Button>
                                </form>

                                {detailError && (
                                    <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{detailError}</div>
                                )}

                                <div className="max-h-80 overflow-auto rounded-lg border" style={{ borderColor: JADE.border }}>
                                    <table className="w-full min-w-[620px] table-fixed text-xs">
                                        <colgroup>
                                            <col className="w-[24%]" /><col className="w-[38%]" /><col className="w-[10%]" /><col className="w-[28%]" />
                                        </colgroup>
                                        <thead className="sticky top-0 bg-[#FBF7EA]">
                                            <tr style={{ borderBottom: `1px solid ${JADE.border}` }}>
                                                {['Date', 'Product', 'Qty', 'Reference'].map((header) => (
                                                    <th key={header} className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: JADE.text }}>{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className={cn(detailLoading && 'opacity-55')}>
                                            {detail.stockIns.map((log) => (
                                                <tr key={log.id} style={{ borderBottom: `1px solid ${JADE.border}` }}>
                                                    <td className="px-2.5 py-2 tabular-nums whitespace-nowrap" style={{ color: JADE.textSecondary }}>{formatOrderDate(log.created_at)}</td>
                                                    <td className="min-w-0 px-2.5 py-2 font-medium" style={{ color: JADE.text }}><CellText text={log.product_name || '—'} maxLen={32} className="font-semibold" /></td>
                                                    <td className="px-2.5 py-2 text-right tabular-nums" style={{ color: JADE.textSecondary }}>{log.quantity}</td>
                                                    <td className="min-w-0 px-2.5 py-2 tabular-nums" style={{ color: JADE.textSecondary }}><CellText text={log.reference || '—'} maxLen={24} /></td>
                                                </tr>
                                            ))}
                                            {detail.stockIns.length === 0 && (
                                                <tr><td colSpan={4} className="px-2.5 py-10 text-center" style={{ color: JADE.textMuted }}>No stock-in records match these filters.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <PaginationControl
                                        current={detail.stockInMeta.currentPage}
                                        total={detail.stockInMeta.lastPage}
                                        onChange={filterStockIns}
                                        disabled={detailLoading || detail.stockInMeta.total === 0}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => downloadStockInsCsv(detail.supplier.supplier_code ?? '', detail.stockIns)}
                                            disabled={detail.stockIns.length === 0}
                                            className="bg-white text-sm font-medium"
                                            style={{ borderColor: JADE.border, color: JADE.textSecondary }}
                                        >
                                            <Download className="size-3.5" />Export Page
                                        </Button>
                                        <Button type="button" onClick={() => setDetailOpen(false)} className="bg-[#20242A] text-sm font-medium text-white hover:bg-[#30353D]">Close</Button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </SidebarLayout>
    );
}

export default Suppliers;
