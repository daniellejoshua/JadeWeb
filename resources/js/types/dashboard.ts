export type PeriodKey =
    | 'today'
    | 'last7'
    | 'last30'
    | 'thisMonth'
    | 'lastMonth'
    | 'thisYear'
    | 'allTime';

export const periodLabels: Record<PeriodKey, string> = {
    today: 'Today',
    last7: 'Last 7 days',
    last30: 'Last 30 days',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    thisYear: 'This Year',
    allTime: 'All time',
};

export const periodOptions = (Object.keys(periodLabels) as PeriodKey[]).map((value) => ({
    value,
    label: periodLabels[value],
}));

export type RevenuePoint = {
    date: string;
    revenue: number;
    expense: number;
    profit: number;
    orders: number;
    synced: boolean;
};

export type PeriodData = {
    label: string;
    stale: boolean;
    hasUnsynced: boolean;
    range: string;
    rangeFull: string;
    series: RevenuePoint[];
    revenue: number;
    profit: number;
    orders: number;
    dayCount: number;
};

export type TopProduct = {
    id: number;
    product_name: string;
    category: string;
    store: string;
    image_url: string | null;
    quantity_sold: number;
    revenue: number;
};

export type InventoryStatus = {
    inStock: number;
    lowStock: number;
    outOfStock: number;
};

export type SyncStatus = {
    label: string;
    detail: string;
};

export type DashboardProps = {
    periods: Record<PeriodKey, PeriodData>;
    topProducts: TopProduct[];
    inventoryStatus: InventoryStatus;
    inventoryValue: number;
    productCount: number;
};