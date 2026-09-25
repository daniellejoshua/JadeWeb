/*
 * DUMMY DATA — delete this file and wire up the API.
 * Every page imports its data + types from here.
 * Mirrors docs/supabase_schema.sql.
 */

import {
    endOfDay,
    endOfMonth,
    format,
    startOfDay,
    startOfHour,
    startOfMonth,
    startOfWeek,
    startOfYear,
    subDays,
    subMonths,
} from 'date-fns';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Product = {
    id: number;
    product_code: string;
    product_name: string;
    category: string;
    unit: string;
    current_stock: number;
    reorder_level: number;
    has_expiry: boolean;
    expiry_date: string | null;
    cost_price: number;
    selling_price: number;
    wholesale_price: number | null;
    supplier_id: number;
    store: string;
    image_url: string | null;
    is_active: boolean;
};

export type StaffUser = {
    id: number;
    username: string;
    full_name: string;
    user_role: string;
    is_active: boolean;
    email: string;
    phone: string;
};

export type Sale = {
    id: number;
    sale_number: string;
    sale_date: string;
    customer_name: string;
    user_id: number;
    user_name: string;
    total_amount: number;
    payment_method: string;
    status: string;
    is_void: boolean;
};

export type InventoryLog = {
    id: number;
    product_id: number;
    product_name: string;
    transaction_type: 'IN' | 'OUT' | 'ADJUST';
    quantity: number;
    previous_stock: number;
    new_stock: number;
    reference: string;
    notes: string;
    user_name: string;
    created_at: string;
};

export type TopProduct = {
    id: number;
    product_name: string;
    category: string;
    quantity_sold: number;
    revenue: number;
    store: string;
    image_url: string | null;
};

export type SyncStatus = {
    label: string;
    detail: string;
};

export type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

export const products: Product[] = [
    { id: 1, product_code: 'MED-001', product_name: 'Paracetamol 500mg (Bioflu)', category: 'Medicines', unit: 'BOX', current_stock: 148, reorder_level: 40, has_expiry: true, expiry_date: '2026-12-30', cost_price: 180.5, selling_price: 240.0, wholesale_price: 200.0, supplier_id: 1, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 2, product_code: 'MED-002', product_name: 'Amoxicillin 500mg Capsule', category: 'Medicines', unit: 'BOX', current_stock: 86, reorder_level: 30, has_expiry: true, expiry_date: '2026-09-15', cost_price: 220.0, selling_price: 285.0, wholesale_price: 245.0, supplier_id: 4, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 3, product_code: 'MED-003', product_name: 'Ibuprofen 400mg', category: 'Medicines', unit: 'BOX', current_stock: 12, reorder_level: 25, has_expiry: true, expiry_date: '2027-02-28', cost_price: 150.0, selling_price: 195.0, wholesale_price: 165.0, supplier_id: 1, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 4, product_code: 'MED-004', product_name: 'Cetirizine 10mg', category: 'Medicines', unit: 'BOX', current_stock: 0, reorder_level: 20, has_expiry: true, expiry_date: '2026-11-20', cost_price: 120.0, selling_price: 160.0, wholesale_price: 135.0, supplier_id: 2, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 5, product_code: 'SUP-001', product_name: 'Vitamin C 1000mg', category: 'Supplements', unit: 'BTL', current_stock: 210, reorder_level: 50, has_expiry: true, expiry_date: '2027-05-30', cost_price: 280.0, selling_price: 380.0, wholesale_price: 310.0, supplier_id: 5, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 6, product_code: 'SUP-002', product_name: 'Vitamin D3 1000IU', category: 'Supplements', unit: 'BTL', current_stock: 74, reorder_level: 30, has_expiry: true, expiry_date: '2027-01-15', cost_price: 340.0, selling_price: 460.0, wholesale_price: 375.0, supplier_id: 5, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 7, product_code: 'SUP-003', product_name: 'Omega-3 Fish Oil 1000mg', category: 'Supplements', unit: 'BTL', current_stock: 5, reorder_level: 20, has_expiry: true, expiry_date: '2026-10-10', cost_price: 520.0, selling_price: 680.0, wholesale_price: 560.0, supplier_id: 7, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 8, product_code: 'SUP-004', product_name: 'Multivitamins + Minerals', category: 'Supplements', unit: 'BTL', current_stock: 132, reorder_level: 40, has_expiry: true, expiry_date: '2027-03-25', cost_price: 310.0, selling_price: 420.0, wholesale_price: 340.0, supplier_id: 5, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 9, product_code: 'SUP-005', product_name: 'Calcium + Vitamin D', category: 'Supplements', unit: 'BTL', current_stock: 58, reorder_level: 25, has_expiry: true, expiry_date: '2026-12-01', cost_price: 290.0, selling_price: 395.0, wholesale_price: 320.0, supplier_id: 7, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 10, product_code: 'PC-001', product_name: 'Alcohol 70% (500ml)', category: 'Personal Care', unit: 'BTL', current_stock: 265, reorder_level: 60, has_expiry: false, expiry_date: null, cost_price: 65.0, selling_price: 95.0, wholesale_price: 75.0, supplier_id: 3, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 11, product_code: 'PC-002', product_name: 'Isopropyl Alcohol 250ml', category: 'Personal Care', unit: 'BTL', current_stock: 8, reorder_level: 30, has_expiry: false, expiry_date: null, cost_price: 42.0, selling_price: 65.0, wholesale_price: 50.0, supplier_id: 3, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 12, product_code: 'PC-003', product_name: 'Hand Sanitizer 100ml', category: 'Personal Care', unit: 'BTL', current_stock: 96, reorder_level: 40, has_expiry: false, expiry_date: null, cost_price: 55.0, selling_price: 80.0, wholesale_price: 62.0, supplier_id: 3, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 13, product_code: 'PC-004', product_name: 'Face Mask (Surgical) 50s', category: 'Personal Care', unit: 'BOX', current_stock: 0, reorder_level: 20, has_expiry: false, expiry_date: null, cost_price: 120.0, selling_price: 175.0, wholesale_price: 135.0, supplier_id: 8, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 14, product_code: 'MS-001', product_name: 'Gauze Pads 2x2 100s', category: 'Medical Supplies', unit: 'BOX', current_stock: 320, reorder_level: 50, has_expiry: true, expiry_date: '2027-06-30', cost_price: 95.0, selling_price: 140.0, wholesale_price: 110.0, supplier_id: 3, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 15, product_code: 'MS-002', product_name: 'Adhesive Tape 1"', category: 'Medical Supplies', unit: 'ROLL', current_stock: 45, reorder_level: 15, has_expiry: false, expiry_date: null, cost_price: 35.0, selling_price: 60.0, wholesale_price: 45.0, supplier_id: 8, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 16, product_code: 'MS-003', product_name: 'Surgical Gloves (Powder-Free) M', category: 'Medical Supplies', unit: 'BOX', current_stock: 155, reorder_level: 40, has_expiry: false, expiry_date: null, cost_price: 180.0, selling_price: 250.0, wholesale_price: 200.0, supplier_id: 8, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 17, product_code: 'MS-004', product_name: 'Syringe 3ml with Needle', category: 'Medical Supplies', unit: 'PCS', current_stock: 18, reorder_level: 50, has_expiry: true, expiry_date: '2027-04-20', cost_price: 8.0, selling_price: 15.0, wholesale_price: 10.0, supplier_id: 8, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 18, product_code: 'MS-005', product_name: 'Digital Thermometer', category: 'Medical Supplies', unit: 'PCS', current_stock: 26, reorder_level: 10, has_expiry: false, expiry_date: null, cost_price: 210.0, selling_price: 350.0, wholesale_price: 250.0, supplier_id: 6, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 19, product_code: 'MS-006', product_name: 'Blood Pressure Monitor', category: 'Medical Supplies', unit: 'PCS', current_stock: 14, reorder_level: 6, has_expiry: false, expiry_date: null, cost_price: 1450.0, selling_price: 2400.0, wholesale_price: 1800.0, supplier_id: 6, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 20, product_code: 'EQ-001', product_name: 'Pulse Oximeter', category: 'Equipment', unit: 'PCS', current_stock: 9, reorder_level: 5, has_expiry: false, expiry_date: null, cost_price: 480.0, selling_price: 850.0, wholesale_price: 600.0, supplier_id: 6, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 21, product_code: 'EQ-002', product_name: 'Nebulizer Kit', category: 'Equipment', unit: 'PCS', current_stock: 7, reorder_level: 4, has_expiry: false, expiry_date: null, cost_price: 1200.0, selling_price: 1950.0, wholesale_price: 1500.0, supplier_id: 6, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 22, product_code: 'MED-005', product_name: 'Loperamide 2mg', category: 'Medicines', unit: 'BOX', current_stock: 63, reorder_level: 25, has_expiry: true, expiry_date: '2027-01-10', cost_price: 90.0, selling_price: 130.0, wholesale_price: 105.0, supplier_id: 2, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 23, product_code: 'MED-006', product_name: 'Salbutamol Inhaler 100mcg', category: 'Medicines', unit: 'PCS', current_stock: 3, reorder_level: 8, has_expiry: true, expiry_date: '2026-08-30', cost_price: 380.0, selling_price: 520.0, wholesale_price: 420.0, supplier_id: 4, store: 'Jade Clinic', image_url: null, is_active: true },
    { id: 24, product_code: 'MED-007', product_name: 'Mefenamic Acid 500mg', category: 'Medicines', unit: 'BOX', current_stock: 112, reorder_level: 35, has_expiry: true, expiry_date: '2027-03-05', cost_price: 140.0, selling_price: 185.0, wholesale_price: 155.0, supplier_id: 1, store: 'Jade Clinic', image_url: null, is_active: true },
];

export const staff: StaffUser[] = [
    { id: 1, username: 'admin', full_name: 'Jade Clinic Admin', user_role: 'Administrator', is_active: true, email: 'admin@jadeclinic.com', phone: '0917-555-0201' },
    { id: 2, username: 'mreyes', full_name: 'Marian Reyes', user_role: 'Pharmacist', is_active: true, email: 'marian.reyes@jadeclinic.com', phone: '0917-555-0202' },
    { id: 3, username: 'jdela', full_name: 'Juan Dela Cruz', user_role: 'Cashier', is_active: true, email: 'juan.dela@jadeclinic.com', phone: '0917-555-0203' },
    { id: 4, username: 'ltorres', full_name: 'Liza Torres', user_role: 'Pharmacist', is_active: true, email: 'liza.torres@jadeclinic.com', phone: '0917-555-0204' },
    { id: 5, username: 'cmendoza', full_name: 'Carlo Mendoza', user_role: 'Staff', is_active: false, email: 'carlo.mendoza@jadeclinic.com', phone: '0917-555-0205' },
    { id: 6, username: 'asolano', full_name: 'Alyssa Solano', user_role: 'Inventory Clerk', is_active: true, email: 'alyssa.solano@jadeclinic.com', phone: '0917-555-0206' },
];

/* Deterministic pseudo-random generator so the mock chart is stable */
function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const rand = mulberry32(20260806);

const customerNames = [
    'Walk-in Customer', 'Maria Santos', 'Ramon Aquino', 'Carla Bautista', 'Efren Villanueva',
    'Nena Dizon', 'Paolo Garcia', 'Ivy Fernando', 'Dennis Ramos', 'Lorna Mendoza',
    'Bong Navarro', 'Teresa Cruz', 'Aldrin Pascual', 'Jane Mercado', 'Oscar Reyes',
];

const paymentMethods = ['Cash', 'GCash', 'Maya', 'Card', 'Cash', 'Cash'];

const saleStatuses = ['Completed', 'Completed', 'Completed', 'Completed', 'Void', 'Pending'];

const productIds = products.map((p) => p.id);

export const sales: Sale[] = Array.from({ length: 365 * 3 * 15 }).map((_, i) => {
    const dayOffset = Math.floor(i / 15);
    const slot = i % 15;
    const date = subDays(new Date(), dayOffset);
    date.setHours(8 + slot, (slot % 2) * 30, 0, 0);
    const month = date.getMonth();
    const seasonal = month === 10 || month === 11 ? 1.18 : month === 0 ? 0.9 : 1;
    const base = (900 + (1095 - dayOffset) * 1.6) * seasonal + slot * 25;
    const noise = rand() * 250;
    const weekend = date.getDay() === 0 || date.getDay() === 6 ? 0.72 : 1;
    const total = Math.round((base * weekend + noise) * 100) / 100;

    return {
        id: i + 1,
        sale_number: `SALE-${String(1200 + i).padStart(5, '0')}`,
        sale_date: format(date, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        customer_name: customerNames[Math.floor(rand() * customerNames.length)],
        user_id: (i % staff.length) + 1,
        user_name: staff[i % staff.length].full_name,
        total_amount: total,
        payment_method: paymentMethods[Math.floor(rand() * paymentMethods.length)],
        status: saleStatuses[Math.floor(rand() * saleStatuses.length)],
        is_void: false,
    };
}).sort((a, b) => (a.sale_date < b.sale_date ? 1 : -1));

const inLog = (p: Product, qty: number, prev: number, ref: string, note: string, user: string, dayAgo: number) => ({
    id: Math.abs(rand() * 1e6),
    product_id: p.id,
    product_name: p.product_name,
    transaction_type: 'IN' as const,
    quantity: qty,
    previous_stock: prev,
    new_stock: prev + qty,
    reference: ref,
    notes: note,
    user_name: user,
    created_at: format(subDays(new Date(), dayAgo), "yyyy-MM-dd'T'HH:mm:ssXXX"),
});

const outLog = (p: Product, qty: number, prev: number, ref: string, note: string, user: string, dayAgo: number) => ({
    id: Math.abs(rand() * 1e6),
    product_id: p.id,
    product_name: p.product_name,
    transaction_type: 'OUT' as const,
    quantity: qty,
    previous_stock: prev,
    new_stock: prev - qty,
    reference: ref,
    notes: note,
    user_name: user,
    created_at: format(subDays(new Date(), dayAgo), "yyyy-MM-dd'T'HH:mm:ssXXX"),
});

export const inventoryLogs: InventoryLog[] = [
    inLog(products[0], 120, 28, 'PO-2026-081', 'Stock replenishment', staff[5].full_name, 0),
    outLog(products[0], 40, 148, 'SALE', 'Walk-in sales', staff[2].full_name, 0),
    inLog(products[4], 60, 150, 'PO-2026-082', 'Stock replenishment', staff[5].full_name, 1),
    outLog(products[4], 35, 210, 'SALE', 'Walk-in sales', staff[2].full_name, 1),
    outLog(products[3], 25, 25, 'SALE', 'Walk-in sales', staff[3].full_name, 1),
    outLog(products[12], 22, 22, 'SALE', 'Sold out to restock', staff[2].full_name, 2),
    outLog(products[6], 30, 35, 'ADJUST', 'Damage during shipment', staff[5].full_name, 2),
    inLog(products[10], 50, 8, 'PO-2026-083', 'Stock replenishment', staff[5].full_name, 3),
    outLog(products[16], 20, 38, 'SALE', 'Walk-in sales', staff[3].full_name, 3),
    inLog(products[7], 45, 87, 'PO-2026-084', 'Stock replenishment', staff[5].full_name, 4),
    outLog(products[18], 3, 17, 'SALE', 'Walk-in sales', staff[3].full_name, 4),
    outLog(products[22], 12, 15, 'SALE', 'Prescription sales', staff[1].full_name, 5),
    inLog(products[23], 40, 72, 'PO-2026-085', 'Stock replenishment', staff[5].full_name, 6),
    outLog(products[23], 22, 112, 'SALE', 'Walk-in sales', staff[2].full_name, 6),
    outLog(products[19], 5, 14, 'SALE', 'Walk-in sales', staff[1].full_name, 7),
    inLog(products[13], 100, 220, 'PO-2026-086', 'Stock replenishment', staff[5].full_name, 7),
    outLog(products[8], 18, 76, 'SALE', 'Walk-in sales', staff[3].full_name, 8),
    inLog(products[1], 50, 36, 'PO-2026-087', 'Stock replenishment', staff[5].full_name, 8),
    outLog(products[1], 14, 86, 'SALE', 'Walk-in sales', staff[2].full_name, 9),
    outLog(products[11], 30, 126, 'SALE', 'Walk-in sales', staff[3].full_name, 9),
    inLog(products[16], 60, 95, 'PO-2026-088', 'Stock replenishment', staff[5].full_name, 10),
    outLog(products[20], 4, 13, 'SALE', 'Walk-in sales', staff[1].full_name, 11),
    inLog(products[15], 30, 15, 'PO-2026-089', 'Stock replenishment', staff[5].full_name, 12),
    outLog(products[9], 20, 285, 'SALE', 'Walk-in sales', staff[2].full_name, 13),
];

export const topProducts: TopProduct[] = [
    { id: 1, product_name: 'Paracetamol 500mg (Bioflu)', category: 'Medicines', quantity_sold: 428, revenue: 102720, store: 'Jade Clinic', image_url: null },
    { id: 5, product_name: 'Vitamin C 1000mg', category: 'Supplements', quantity_sold: 356, revenue: 135280, store: 'Jade Clinic', image_url: null },
    { id: 24, product_name: 'Mefenamic Acid 500mg', category: 'Medicines', quantity_sold: 293, revenue: 54205, store: 'Jade Clinic', image_url: null },
    { id: 14, product_name: 'Gauze Pads 2x2 100s', category: 'Medical Supplies', quantity_sold: 241, revenue: 33740, store: 'Jade Clinic', image_url: null },
    { id: 8, product_name: 'Multivitamins + Minerals', category: 'Supplements', quantity_sold: 197, revenue: 82740, store: 'Jade Clinic', image_url: null },
];

export const syncStatus: SyncStatus = {
    label: 'Synced 2m ago',
    detail: 'Last sync: LAN POS → Supabase',
};

export const inventoryStatus = {
    inStock: products.filter((p) => p.current_stock > p.reorder_level).length,
    lowStock: products.filter((p) => p.current_stock > 0 && p.current_stock <= p.reorder_level).length,
    outOfStock: products.filter((p) => p.current_stock <= 0).length,
};

/* ------------------------------------------------------------------ */
/* Derived helpers (used by the dashboard)                             */
/* ------------------------------------------------------------------ */

export type RevenuePoint = {
    date: string;
    revenue: number;
    expense: number;
    profit: number;
    orders: number;
};

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

export function periodRange(key: PeriodKey): { start: Date; end: Date } | null {
    const now = new Date();
    switch (key) {
        case 'today':
            return { start: startOfDay(now), end: endOfDay(now) };
        case 'last7':
            return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
        case 'last30':
            return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
        case 'thisMonth':
            return { start: startOfMonth(now), end: endOfDay(now) };
        case 'lastMonth':
            return {
                start: startOfMonth(subMonths(now, 1)),
                end: endOfMonth(subMonths(now, 1)),
            };
        case 'thisYear':
            return { start: startOfYear(now), end: endOfDay(now) };
        case 'allTime':
            return null;
    }
}

export function periodDayCount(key: PeriodKey): number {
    const range = periodRange(key);
    if (range) return Math.max(1, Math.floor((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1);
    const dates = sales.map((s) => new Date(s.sale_date).getTime());
    return Math.max(1, Math.floor((Math.max(...dates) - Math.min(...dates)) / 86_400_000) + 1);
}

function salesInPeriod(key: PeriodKey): Sale[] {
    const range = periodRange(key);
    if (!range) return sales;
    const from = range.start.getTime();
    const to = range.end.getTime();
    return sales.filter((s) => {
        const t = new Date(s.sale_date).getTime();
        return t >= from && t <= to;
    });
}

type Granularity = 'hour' | 'day' | 'week' | 'month';

function granularityFor(key: PeriodKey): Granularity {
    if (key === 'today') return 'hour';
    if (key === 'allTime') return 'month';
    const days = periodDayCount(key);
    if (days <= 31) return 'day';
    if (days <= 180) return 'week';
    return 'month';
}

function bucketStart(date: Date, granularity: Granularity): Date {
    if (granularity === 'hour') return startOfHour(date);
    if (granularity === 'week') return startOfWeek(date, { weekStartsOn: 1 });
    if (granularity === 'month') return startOfMonth(date);
    return startOfDay(date);
}

export function getRevenueSeries(key: PeriodKey): RevenuePoint[] {
    const granularity = granularityFor(key);
    const range = periodRange(key);
    const inPeriod = range
        ? (s: Sale) => {
              const t = new Date(s.sale_date).getTime();
              return t >= range.start.getTime() && t <= range.end.getTime();
          }
        : () => true;

    const buckets = new Map<string, { start: Date; revenue: number; orders: number }>();
    for (const sale of sales) {
        if (sale.status === 'Void' || !inPeriod(sale)) continue;
        const start = bucketStart(new Date(sale.sale_date), granularity);
        const bucketKey = format(start, granularity === 'hour' ? 'yyyy-MM-dd HH' : 'yyyy-MM-dd');
        const bucket = buckets.get(bucketKey) ?? { start, revenue: 0, orders: 0 };
        bucket.revenue += sale.total_amount;
        bucket.orders += 1;
        buckets.set(bucketKey, bucket);
    }

    return [...buckets.values()]
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map(({ start, revenue, orders }) => {
            const rounded = Math.round(revenue * 100) / 100;
            const profit = Math.round(rounded * grossMargin * 100) / 100;
            return {
                date: format(
                    start,
                    granularity === 'month' ? 'MMM yyyy' : granularity === 'hour' ? 'h a' : 'MMM d',
                ),
                revenue: rounded,
                expense: Math.round((rounded - profit) * 100) / 100,
                profit,
                orders,
            };
        });
}

export function salesInRange(key: PeriodKey): Sale[] {
    return salesInPeriod(key).filter((s) => s.status !== 'Void');
}

export function revenueInRange(key: PeriodKey): number {
    return Math.round(salesInRange(key).reduce((sum, s) => sum + s.total_amount, 0) * 100) / 100;
}

export const grossMargin = 0.34;

export function inventoryValue(): number {
    return Math.round(products.reduce((sum, p) => sum + p.current_stock * p.cost_price, 0) * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* AI Assistant (dummy brain — replace with API later)                 */
/* ------------------------------------------------------------------ */

export function mockAssistantReply(input: string): string {
    const q = input.toLowerCase();

    if (q.includes('sale') || q.includes('revenue') || q.includes('income')) {
        return `Here's the latest on sales at **Jade Clinic**:

| Metric | Value |
| --- | --- |
| Revenue (30d) | ₱${revenueInRange('last30').toLocaleString()} |
| Orders (30d) | ${salesInRange('last30').length} |
| Gross margin | ${Math.round(grossMargin * 100)}% |

> Revenue grew steadily over the past two weeks, with weekends slightly slower than weekdays.

Want me to break this down per product or payment method?`;
    }

    if (q.includes('stock') || q.includes('inventory') || q.includes('low')) {
        return `Current inventory health:

- **In stock:** ${inventoryStatus.inStock} items
- **Low stock:** ${inventoryStatus.lowStock} items
- **Out of stock:** ${inventoryStatus.outOfStock} items

Products that need restocking soon:
- ${products.filter((p) => p.current_stock <= p.reorder_level).slice(0, 3).map((p) => `**${p.product_name}** (${p.current_stock} left)`).join('\n- ')}

Would you like me to prepare a purchase order for these?`;
    }

    if (q.includes('product') || q.includes('top')) {
        return `Your top selling products this month:

1. **Paracetamol 500mg** — 428 units, ₱102,720
2. **Vitamin C 1000mg** — 356 units, ₱135,280
3. **Mefenamic Acid 500mg** — 293 units, ₱54,205

See the full list under *Products* or *Dashboard → Top Selling Products*.`;
    }

    if (q.includes('staff') || q.includes('user') || q.includes('employee')) {
        return `You have **6 staff accounts** on file, with **5 active** right now.

- Pharmacists: 2
- Cashier: 1
- Inventory Clerk: 1
- Administrator: 1

You can manage them from the **Staff** page.`;
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('help')) {
        return `Hello! I'm **Jade**, your clinic's AI assistant. 👋

I can help you with:
- **Sales & revenue** summaries
- **Inventory & stock** health checks
- **Product** performance
- **Staff** information

Just ask me something like *"how are sales this month?"* or *"what's running low?"*`;
    }

    return `I can pull that up for you. Here's what I know so far:

I'm connected to **dummy data** at the moment — real clinic data will be wired up soon. You can ask me about **sales, inventory, products, or staff**, and I'll summarize them from the dashboard.

> Tip: try "how are sales this month?" or "any low stock items?"`;
}

export const initialAssistantMessages: ChatMessage[] = [
    {
        id: 'msg-1',
        role: 'assistant',
        content: `Hello! I'm **Jade**, your AI clinic assistant. 👋

Ask me anything about your **sales**, **inventory**, **products**, or **staff**, and I'll give you a quick summary.`,
        timestamp: new Date(),
    },
];

/* Helper for the recent-sales table + status badge coloring */
export function recentSales(count: number): Sale[] {
    return sales.filter((s) => s.status !== 'Void').slice(0, count);
}

export function formatSaleDate(iso: string): string {
    return format(new Date(iso), 'MMM d, yyyy h:mm a');
}
