import SidebarLayout from '@/Layouts/SidebarLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import {
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    Info,
    Plus,
    Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type LogType = 'all' | 'IN' | 'OUT';

type InventoryLog = {
    id: number;
    product_name: string;
    category: string | null;
    transaction_type: 'IN' | 'OUT' | 'ADJUST';
    quantity: number;
    previous_stock: number | null;
    new_stock: number | null;
    supplier_name: string | null;
    reference: string | null;
    batch_number: string | null;
    expiry_date: string | null;
    notes: string | null;
    created_at: string;
};

type PaginationMeta = {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    from: number | null;
    to: number | null;
};

type InventoryLogProps = {
    logs: InventoryLog[];
    meta: PaginationMeta;
    filters: {
        search: string;
        type: LogType;
        date: string;
        dateEnabled: boolean;
    };
};

const typeStyles: Record<InventoryLog['transaction_type'], string> = {
    IN: 'border-0 bg-emerald-100 text-emerald-700',
    OUT: 'border-0 bg-red-100 text-red-700',
    ADJUST: 'border-0 bg-amber-100 text-amber-700',
};

const fieldLabel = 'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';

function formatDateTime(value: string, seconds = false): string {
    return new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: seconds ? '2-digit' : undefined,
        hour12: false,
    }).format(new Date(value));
}

function formatExpiry(value: string | null): string {
    if (!value) return 'Not provided';
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[2]}/${match[3]}/${match[1]}` : value;
}

function valueOrDash(value: string | number | null): string | number {
    return value === null || value === '' ? '—' : value;
}

function Pagination({ meta, onPage }: { meta: PaginationMeta; onPage: (page: number) => void }) {
    const buttonClass = 'inline-flex size-8 items-center justify-center rounded-lg border transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-35';

    return (
        <div className="flex items-center gap-1.5">
            <button type="button" className={buttonClass} disabled={meta.currentPage === 1} onClick={() => onPage(1)} aria-label="First page"><ChevronFirst className="size-4" /></button>
            <button type="button" className={buttonClass} disabled={meta.currentPage === 1} onClick={() => onPage(meta.currentPage - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
            <span className="px-2 text-xs tabular-nums text-muted-foreground">Page {meta.currentPage} of {meta.lastPage}</span>
            <button type="button" className={buttonClass} disabled={meta.currentPage === meta.lastPage} onClick={() => onPage(meta.currentPage + 1)} aria-label="Next page"><ChevronRight className="size-4" /></button>
            <button type="button" className={buttonClass} disabled={meta.currentPage === meta.lastPage} onClick={() => onPage(meta.lastPage)} aria-label="Last page"><ChevronLast className="size-4" /></button>
        </div>
    );
}

function DetailModal({ log, onOpenChange }: { log: InventoryLog | null; onOpenChange: (open: boolean) => void }) {
    const fields = log ? [
        ['Log ID', log.id],
        ['Product', log.product_name],
        ['Category', log.category],
        ['Transaction Type', log.transaction_type],
        ['Quantity', log.quantity],
        ['Previous Stock', log.previous_stock],
        ['New Stock', log.new_stock],
        ['Supplier', log.supplier_name],
        ['Reference', log.reference],
        ['Batch Number', log.batch_number],
        ['Expiry Date', formatExpiry(log.expiry_date)],
        ['Created At', formatDateTime(log.created_at, true)],
    ] as const : [];

    return (
        <Dialog open={log !== null} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Inventory Log Details</DialogTitle>
                    <DialogDescription>Synced stock movement from the LAN POS.</DialogDescription>
                </DialogHeader>
                {log && (
                    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                        {fields.map(([label, value]) => (
                            <div key={label} className={label === 'Product' ? 'sm:col-span-2' : undefined}>
                                <dt className={fieldLabel}>{label}</dt>
                                <dd className="mt-1 break-words font-medium">{valueOrDash(value)}</dd>
                            </div>
                        ))}
                        <div className="sm:col-span-2">
                            <dt className={fieldLabel}>Notes</dt>
                            <dd className="mt-1 min-h-16 whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-3">{valueOrDash(log.notes)}</dd>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function InventoryLogs() {
    const { logs, meta, filters } = usePage<PageProps & InventoryLogProps>().props;
    const [search, setSearch] = useState(filters.search);
    const [selectedLog, setSelectedLog] = useState<InventoryLog | null>(null);
    const [noticeOpen, setNoticeOpen] = useState(false);

    function queryParams(overrides: Partial<{ search: string; type: LogType; date: string; dateEnabled: boolean; page: number }> = {}) {
        const values = {
            search: overrides.search ?? filters.search,
            type: overrides.type ?? filters.type,
            date: overrides.date ?? filters.date,
            dateEnabled: overrides.dateEnabled ?? filters.dateEnabled,
            page: overrides.page,
        };
        const params: Record<string, string | number> = {};

        if (values.search.trim() !== '') params.search = values.search.trim();
        if (values.type !== 'all') params.type = values.type;
        if (values.dateEnabled) params.date = values.date;
        else params.date_enabled = 0;
        if (values.page && values.page > 1) params.page = values.page;

        return params;
    }

    function visit(overrides: Parameters<typeof queryParams>[0] = {}) {
        router.get(route('inventory-logs'), queryParams(overrides), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    useEffect(() => setSearch(filters.search), [filters.search]);

    useEffect(() => {
        if (search === filters.search) return;
        const timer = window.setTimeout(() => visit({ search }), 350);
        return () => window.clearTimeout(timer);
    }, [search, filters.search]);

    const exportUrl = route('inventory-logs.export', queryParams());

    return (
        <SidebarLayout title="Inventory Logs" subtitle={`${meta.total} synced stock movements`}>
            <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-white">
                <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
                    <div className="relative min-w-56 flex-1 sm:max-w-sm">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search ID, reference, or product..."
                            className="pl-9"
                        />
                    </div>
                    <Select value={filters.type} onValueChange={(value) => visit({ type: value as LogType })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="IN">IN</SelectItem>
                            <SelectItem value="OUT">OUT</SelectItem>
                        </SelectContent>
                    </Select>
                    <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                        <input
                            type="checkbox"
                            checked={filters.dateEnabled}
                            onChange={(event) => visit({ dateEnabled: event.target.checked })}
                            className="size-4 accent-[#BE9A30]"
                        />
                        Date
                    </label>
                    <Input
                        type="date"
                        value={filters.date}
                        disabled={!filters.dateEnabled}
                        onChange={(event) => visit({ date: event.target.value, dateEnabled: true })}
                        className="w-40"
                    />
                    <div className="flex gap-2 sm:ml-auto">
                        <Button variant="outline" asChild><a href={exportUrl}><Download className="size-4" />Export</a></Button>
                        <Button onClick={() => setNoticeOpen(true)} className="bg-[#20242A] text-white hover:bg-[#30353D]"><Plus className="size-4" />Add Log</Button>
                    </div>
                    {filters.search !== '' && filters.dateEnabled && (
                        <p className="w-full text-xs text-muted-foreground">Search is active, so the date filter is temporarily ignored.</p>
                    )}
                </div>

                <div className="max-h-[calc(100vh-17rem)] min-h-64 overflow-y-auto">
                    <table className="w-full table-fixed text-xs">
                        <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_hsl(var(--border))]">
                            <tr>
                                <th className="w-14 px-2 py-3 text-left">ID</th>
                                <th className="px-2 py-3 text-left">Product</th>
                                <th className="w-20 px-2 py-3 text-left">Type</th>
                                <th className="w-14 px-2 py-3 text-right">Qty</th>
                                <th className="hidden w-16 px-2 py-3 text-right md:table-cell">Prev</th>
                                <th className="hidden w-16 px-2 py-3 text-right md:table-cell">New</th>
                                <th className="hidden px-2 py-3 text-left lg:table-cell">Supplier</th>
                                <th className="hidden px-2 py-3 text-left xl:table-cell">Reference</th>
                                <th className="hidden px-2 py-3 text-left 2xl:table-cell">Notes</th>
                                <th className="hidden w-36 px-2 py-3 text-left sm:table-cell">Date &amp; Time</th>
                                <th className="w-14 px-2 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="cursor-default border-b transition-colors hover:bg-[#FBF7EA]" onDoubleClick={() => setSelectedLog(log)}>
                                    <td className="truncate px-2 py-2 font-semibold tabular-nums">{log.id}</td>
                                    <td className="truncate px-2 py-2 font-medium" title={log.product_name}>{log.product_name}</td>
                                    <td className="px-2 py-2"><Badge variant="outline" className={cn('rounded-full', typeStyles[log.transaction_type])}>{log.transaction_type}</Badge></td>
                                    <td className="px-2 py-2 text-right font-semibold tabular-nums">{log.quantity}</td>
                                    <td className="hidden px-2 py-2 text-right tabular-nums text-muted-foreground md:table-cell">{valueOrDash(log.previous_stock)}</td>
                                    <td className="hidden px-2 py-2 text-right tabular-nums md:table-cell">{valueOrDash(log.new_stock)}</td>
                                    <td className="hidden truncate px-2 py-2 text-muted-foreground lg:table-cell" title={log.supplier_name ?? undefined}>{valueOrDash(log.supplier_name)}</td>
                                    <td className="hidden truncate px-2 py-2 text-muted-foreground xl:table-cell" title={log.reference ?? undefined}>{valueOrDash(log.reference)}</td>
                                    <td className="hidden truncate px-2 py-2 text-muted-foreground 2xl:table-cell" title={log.notes ?? undefined}>{valueOrDash(log.notes)}</td>
                                    <td className="hidden px-2 py-2 tabular-nums text-muted-foreground sm:table-cell">{formatDateTime(log.created_at)}</td>
                                    <td className="p-0 text-center">
                                        <button type="button" className="flex h-12 w-full items-center justify-center hover:text-[#BE9A30]" onClick={() => setSelectedLog(log)} aria-label={`View inventory log ${log.id}`} title="View details"><Eye className="size-4" /></button>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr><td colSpan={11} className="px-6 py-16 text-center text-sm text-muted-foreground">No inventory logs match the current filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-muted-foreground">{meta.total === 0 ? 'No records' : `Showing ${meta.from} to ${meta.to} of ${meta.total} logs`}</span>
                    <Pagination meta={meta} onPage={(page) => visit({ page })} />
                </div>
            </div>

            <DetailModal log={selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)} />

            <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
                <DialogContent>
                    <DialogHeader>
                        <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Info className="size-5" /></div>
                        <DialogTitle>Add inventory logs in the LAN POS</DialogTitle>
                        <DialogDescription>
                            JadeWeb is a read-only view of synced clinic data. Create stock entries or adjustments in the LAN POS so inventory totals remain authoritative and sync safely.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter showCloseButton />
                </DialogContent>
            </Dialog>
        </SidebarLayout>
    );
}

export default InventoryLogs;
