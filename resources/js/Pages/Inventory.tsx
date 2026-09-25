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
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Package, RotateCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type InventoryProduct = {
    id: number;
    product_code: string;
    product_name: string;
    category: string | null;
    unit: string | null;
    current_stock: number;
    reorder_level: number;
    cost_price: number;
    selling_price: number;
    image_url: string | null;
    is_active: boolean;
};

type InventoryProps = {
    products: InventoryProduct[];
    categories: string[];
    totalProducts: number;
};

const JADE = {
    gold: '#BE9A30',
    goldBright: '#FEBF10',
    border: '#E8E6E1',
    text: '#20242A',
    textSecondary: '#626873',
    textMuted: '#8A8F98',
    stockHealthy: '#2E9B45',
    stockWarning: '#E6A000',
    stockCritical: '#E54832',
    thumb: '#F3F2EF',
    tint: '#FBF7EA',
};

type StatusFilter = 'all' | 'active' | 'inactive';
type StockFilter = 'all' | 'in' | 'low' | 'out';

const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const stockOptions: { value: StockFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'in', label: 'In Stock' },
    { value: 'low', label: 'Low Stock' },
    { value: 'out', label: 'Out of Stock' },
];

function formatPeso(value: number): string {
    return '₱' + value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function stockState(p: Pick<InventoryProduct, 'current_stock' | 'reorder_level'>) {
    if (p.current_stock <= 0) return 'critical';
    if (p.current_stock <= p.reorder_level) return 'low';
    return 'healthy';
}

const stockColor: Record<'healthy' | 'low' | 'critical', string> = {
    healthy: JADE.stockHealthy,
    low: JADE.stockWarning,
    critical: JADE.stockCritical,
};

function StatusBadge({ active }: { active: boolean }) {
    const style = active
        ? { backgroundColor: '#E7F4EA', color: JADE.stockHealthy }
        : { backgroundColor: JADE.thumb, color: JADE.textMuted };
    return (
        <span
            className="inline-flex h-5 max-w-full items-center rounded-full px-1.5 text-[10px] font-medium"
            style={style}
        >
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function StockCell({ product }: { product: InventoryProduct }) {
    return (
        <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: stockColor[stockState(product)] }}
        >
            {product.current_stock}
        </span>
    );
}

function CellText({ text, className }: { text: string; className?: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={cn('block truncate', className)}>{text}</span>
            </TooltipTrigger>
            <TooltipContent>{text}</TooltipContent>
        </Tooltip>
    );
}

function PaginationControl({
    current,
    total,
    onChange,
}: {
    current: number;
    total: number;
    onChange: (page: number) => void;
}) {
    const arrowBase =
        'inline-flex size-8 items-center justify-center rounded-lg text-sm transition-colors disabled:pointer-events-none disabled:opacity-40';

    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                aria-label="First page"
                disabled={current === 1}
                onClick={() => onChange(1)}
                className={arrowBase}
                style={{ color: JADE.textSecondary }}
            >
                <ChevronFirst className="size-4" />
            </button>
            <button
                type="button"
                aria-label="Previous page"
                disabled={current === 1}
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
                disabled={current === total}
                onClick={() => onChange(Math.min(total, current + 1))}
                className={arrowBase}
                style={{ color: JADE.textSecondary }}
            >
                <ChevronRight className="size-4" />
            </button>
            <button
                type="button"
                aria-label="Last page"
                disabled={current === total}
                onClick={() => onChange(total)}
                className={arrowBase}
                style={{ color: JADE.textSecondary }}
            >
                <ChevronLast className="size-4" />
            </button>
        </div>
    );
}

function FilterPanel({
    status,
    onStatus,
    search,
    onSearch,
    category,
    onCategory,
    stock,
    onStock,
    minPrice,
    onMinPrice,
    maxPrice,
    onMaxPrice,
    quantity,
    onQuantity,
    onReset,
    categories,
}: {
    status: StatusFilter;
    onStatus: (value: StatusFilter) => void;
    search: string;
    onSearch: (value: string) => void;
    category: string;
    onCategory: (value: string) => void;
    stock: StockFilter;
    onStock: (value: StockFilter) => void;
    minPrice: string;
    onMinPrice: (value: string) => void;
    maxPrice: string;
    onMaxPrice: (value: string) => void;
    quantity: string;
    onQuantity: (value: string) => void;
    onReset: () => void;
    categories: string[];
}) {
    return (
        <div
            className="flex h-full min-h-0 flex-col rounded-xl border bg-white"
            style={{ borderColor: JADE.border }}
        >
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-4">
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs leading-none font-medium" style={{ color: JADE.textSecondary }}>
                        Status
                    </span>
                    <div
                        className="flex overflow-hidden rounded-lg border"
                        style={{ borderColor: JADE.border }}
                    >
                        {statusOptions.map((option) => {
                            const selected = status === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onStatus(option.value)}
                                    className="flex-1 rounded-none px-2 py-1.5 text-xs font-medium transition-colors"
                                    style={
                                        selected
                                            ? {
                                                  backgroundColor:
                                                      option.value === 'active'
                                                          ? JADE.stockHealthy
                                                          : option.value === 'inactive'
                                                            ? JADE.stockCritical
                                                            : JADE.gold,
                                                  color: '#fff',
                                              }
                                            : { backgroundColor: '#fff', color: JADE.textSecondary }
                                    }
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs leading-none font-medium" style={{ color: JADE.textSecondary }}>
                        Search
                    </span>
                    <div className="relative">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                            style={{ color: JADE.textMuted }}
                        />
                        <Input
                            value={search}
                            onChange={(e) => onSearch(e.target.value)}
                            placeholder="Search products..."
                            className="pl-9"
                            style={{ borderColor: JADE.border }}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs leading-none font-medium" style={{ color: JADE.textSecondary }}>
                        Category
                    </span>
                    <Select value={category} onValueChange={onCategory}>
                        <SelectTrigger
                            className="w-full"
                            style={{ borderColor: JADE.border }}
                        >
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((item) => (
                                <SelectItem key={item} value={item}>
                                    {item}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs leading-none font-medium" style={{ color: JADE.textSecondary }}>
                        Stock
                    </span>
                    <Select value={stock} onValueChange={(v) => onStock(v as StockFilter)}>
                        <SelectTrigger className="w-full" style={{ borderColor: JADE.border }}>
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            {stockOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs leading-none font-medium" style={{ color: JADE.textSecondary }}>
                        Price Range
                    </span>
                    <div className="flex items-center gap-2">
                        <Input
                            value={minPrice}
                            onChange={(e) => onMinPrice(e.target.value)}
                            placeholder="Min Price"
                            inputMode="decimal"
                            style={{ borderColor: JADE.border }}
                        />
                        <span className="text-xs" style={{ color: JADE.textMuted }}>
                            —
                        </span>
                        <Input
                            value={maxPrice}
                            onChange={(e) => onMaxPrice(e.target.value)}
                            placeholder="Max Price"
                            inputMode="decimal"
                            style={{ borderColor: JADE.border }}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs leading-none font-medium" style={{ color: JADE.textSecondary }}>
                        Piece/Item/Quantity
                    </span>
                    <Input
                        value={quantity}
                        onChange={(e) => onQuantity(e.target.value)}
                        placeholder="Enter quantity..."
                        inputMode="numeric"
                        style={{ borderColor: JADE.border }}
                    />
                </div>

                <div className="mt-auto border-t pt-3" style={{ borderColor: JADE.border }}>
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onReset}
                        className="w-full bg-white text-sm font-medium"
                        style={{ borderColor: JADE.gold, color: JADE.gold }}
                    >
                        <RotateCcw className="size-3.5" />
                        Reset Filters
                    </Button>
                </div>
            </div>
        </div>
    );
}

function Inventory() {
    const { products } = usePage<PageProps & InventoryProps>().props;

    const [status, setStatus] = useState<StatusFilter>('all');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [stock, setStock] = useState<StockFilter>('all');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 7;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const min = parseFloat(minPrice);
        const max = parseFloat(maxPrice);
        const qty = quantity.trim() === '' ? null : parseInt(quantity, 10);

        return products.filter((p) => {
            if (status === 'active' && !p.is_active) return false;
            if (status === 'inactive' && p.is_active) return false;
            if (category !== 'all' && p.category !== category) return false;
            if (q && !`${p.product_name} ${p.product_code}`.toLowerCase().includes(q)) return false;
            if (stock === 'in' && !(p.current_stock > p.reorder_level)) return false;
            if (stock === 'low' && !(p.current_stock > 0 && p.current_stock <= p.reorder_level)) return false;
            if (stock === 'out' && !(p.current_stock <= 0)) return false;
            if (!Number.isNaN(min) && p.selling_price < min) return false;
            if (!Number.isNaN(max) && p.selling_price > max) return false;
            if (qty !== null && p.current_stock !== qty) return false;
            return true;
        });
    }, [products, status, search, category, stock, minPrice, maxPrice, quantity]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const paged = filtered.slice(start, start + PAGE_SIZE);

    function goToPage(next: number) {
        setPage(Math.max(1, Math.min(totalPages, next)));
    }

    function onChangeFilters(setter: () => void) {
        setter();
        setPage(1);
    }

    function resetFilters() {
        setStatus('all');
        setSearch('');
        setCategory('all');
        setStock('all');
        setMinPrice('');
        setMaxPrice('');
        setQuantity('');
        setPage(1);
    }

    return (
        <SidebarLayout
            title="Inventory"
            subtitle="View products, stock, pricing, and availability."
        >
            <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                <FilterPanel
                    status={status}
                    onStatus={(v) => onChangeFilters(() => setStatus(v))}
                    search={search}
                    onSearch={(v) => onChangeFilters(() => setSearch(v))}
                    category={category}
                    onCategory={(v) => onChangeFilters(() => setCategory(v))}
                    stock={stock}
                    onStock={(v) => onChangeFilters(() => setStock(v))}
                    minPrice={minPrice}
                    onMinPrice={(v) => onChangeFilters(() => setMinPrice(v))}
                    maxPrice={maxPrice}
                    onMaxPrice={(v) => onChangeFilters(() => setMaxPrice(v))}
                    quantity={quantity}
                    onQuantity={(v) => onChangeFilters(() => setQuantity(v))}
                    onReset={resetFilters}
                    categories={products.reduce<string[]>((acc, p) => {
                        if (p.category && !acc.includes(p.category)) acc.push(p.category);
                        return acc;
                    }, []).sort()}
                />

                <div
                    className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-white"
                    style={{ borderColor: JADE.border }}
                >
                    <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden lg:overflow-x-hidden">
                        <table className="w-full min-w-[680px] table-fixed text-xs lg:min-w-0">
                            <colgroup>
                                <col className="w-[30%]" />
                                <col className="w-[16%]" />
                                <col className="w-[8%]" />
                                <col className="w-[9%]" />
                                <col className="w-[13%]" />
                                <col className="w-[13%]" />
                                <col className="w-[11%]" />
                            </colgroup>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${JADE.border}` }}>
                                    {[
                                        'Product Information',
                                        'Category',
                                        'Unit',
                                        'Stock',
                                        'Cost',
                                        'Price',
                                        'Status',
                                    ].map((header) => (
                                        <th
                                            key={header}
                                            className="truncate px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide"
                                            style={{ color: JADE.text }}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="transition-colors hover:bg-[#FBF7EA]"
                                        style={{ borderBottom: `1px solid ${JADE.border}` }}
                                    >
                                        <td className="overflow-hidden px-2.5 py-1.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt=""
                                                        className="size-8 shrink-0 rounded-lg object-contain"
                                                        style={{ backgroundColor: JADE.thumb }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                                                        style={{ backgroundColor: JADE.thumb, color: JADE.textMuted }}
                                                    >
                                                        <Package className="size-4" />
                                                    </div>
                                                )}
                                                <div className="flex min-w-0 flex-col">
                                                    <CellText
                                                        text={product.product_name}
                                                        className="font-semibold"
                                                    />
                                                    <span className="truncate text-[11px]" style={{ color: JADE.textMuted }}>
                                                        Code: {product.product_code}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-2.5 py-1.5" style={{ color: JADE.textSecondary }}>
                                            <CellText text={product.category ?? '—'} />
                                        </td>
                                        <td className="px-2.5 py-1.5" style={{ color: JADE.textSecondary }}>
                                            <CellText text={product.unit ?? '—'} />
                                        </td>
                                        <td className="px-2.5 py-1.5">
                                            <StockCell product={product} />
                                        </td>
                                        <td className="truncate px-2.5 py-1.5 tabular-nums" style={{ color: JADE.textSecondary }}>
                                            <span title={formatPeso(product.cost_price)}>{formatPeso(product.cost_price)}</span>
                                        </td>
                                        <td className="truncate px-2.5 py-1.5 font-medium tabular-nums" style={{ color: JADE.text }}>
                                            <span title={formatPeso(product.selling_price)}>{formatPeso(product.selling_price)}</span>
                                        </td>
                                        <td className="px-2.5 py-1.5">
                                            <StatusBadge active={product.is_active} />
                                        </td>
                                    </tr>
                                ))}
                                {Array.from({ length: PAGE_SIZE - paged.length }).map((_, i) => (
                                    <tr key={`empty-${i}`} style={{ height: 44 }}>
                                        <td colSpan={7} />
                                    </tr>
                                ))}
                                {paged.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-12 text-center text-sm"
                                            style={{ color: JADE.textMuted }}
                                        >
                                            No products match the current filters.
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
                            Showing {filtered.length === 0 ? 0 : start + 1} to{' '}
                            {Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length} items
                        </span>

                        <PaginationControl current={currentPage} total={totalPages} onChange={goToPage} />
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}

export default Inventory;
