import SidebarLayout from '@/Layouts/SidebarLayout';
import { usePage } from '@inertiajs/react';
import AiAssistantCard from '@/components/dashboard/AiAssistantCard';
import InventoryDonut from '@/components/dashboard/InventoryDonut';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import StatCard from '@/components/dashboard/StatCard';
import TopSellingTable from '@/components/dashboard/TopSellingTable';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    grossMargin,
    inventoryValue,
    periodDayCount,
    periodLabels,
    periodOptions,
    periodRange,
    products,
    revenueInRange,
    salesInRange,
    type PeriodKey,
} from '@/data/mock';
import { formatCompactCurrency, formatCurrency, formatNumber, formatShortDate } from '@/lib/format';
import { Banknote, Boxes, ShoppingBag, TrendingUp } from 'lucide-react';
import { useState } from 'react';

function Dashboard() {
    const user = usePage().props.auth.user;

    const [period, setPeriod] = useState<PeriodKey>('last30');

    const revenue = revenueInRange(period);
    const orders = salesInRange(period).length;
    const dayCount = periodDayCount(period);

    const profit = revenue * grossMargin;
    const inventory = inventoryValue();
    const fullValue = (value: number) => formatCurrency(value) !== formatCompactCurrency(value)
        ? formatCurrency(value)
        : undefined;

    const range = periodRange(period);
    const revenueSub = range
        ? range.start.toDateString() === range.end.toDateString()
            ? formatShortDate(range.start)
            : `${formatShortDate(range.start)} – ${formatShortDate(range.end)}`
        : periodLabels[period];

    const dateRange = (
        <Select value={period} onValueChange={(value) => setPeriod(value as PeriodKey)}>
            <SelectTrigger className="h-9 w-[150px] rounded-full border-border/60 shadow-none">
                <SelectValue />
            </SelectTrigger>
            <SelectContent
                align="end"
                side="bottom"
                sideOffset={6}
                position="popper"
                collisionPadding={12}
                className="min-w-44 rounded-2xl"
            >
                {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    return (
        <SidebarLayout
            title="Dashboard"
            subtitle={`Welcome back${user?.name ? `, ${user.name}` : ''}`}
            dateRange={dateRange}
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="flex flex-col gap-6 lg:col-span-3">
                    <PerformanceChart period={period} />
                    <TopSellingTable />
                </div>

                <div className="flex flex-col gap-6 lg:col-span-2">
                    <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2">
                        <StatCard
                            label="Total Revenue"
                            value={formatCompactCurrency(revenue)}
                            sub={revenueSub}
                            icon={Banknote}
                            tooltip={fullValue(revenue)}
                        />
                        <StatCard
                            label="Total Orders"
                            value={formatNumber(orders)}
                            sub={`Avg ${formatNumber(Math.round(orders / Math.max(dayCount, 1)))} per day`}
                            icon={ShoppingBag}
                        />
                        <StatCard
                            label="Gross Profit"
                            value={formatCompactCurrency(profit)}
                            sub={`${Math.round(grossMargin * 100)}% margin`}
                            icon={TrendingUp}
                            tooltip={fullValue(profit)}
                        />
                        <StatCard
                            label="Inventory Value"
                            value={formatCompactCurrency(inventory)}
                            sub={`${products.length} products`}
                            icon={Boxes}
                            tooltip={fullValue(inventory)}
                        />
                    </div>

                    <InventoryDonut />
                    <AiAssistantCard />
                </div>
            </div>
        </SidebarLayout>
    );
}

export default Dashboard;
