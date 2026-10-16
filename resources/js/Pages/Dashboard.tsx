import SidebarLayout from '@/Layouts/SidebarLayout';
import { usePage } from '@inertiajs/react';
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
    periodOptions,
    type DashboardProps,
    type PeriodData,
    type PeriodKey,
} from '@/types/dashboard';
import { formatCompactCurrency, formatCurrency, formatNumber } from '@/lib/format';
import type { PageProps } from '@inertiajs/core';
import { Banknote, Boxes, ShoppingBag, TrendingUp } from 'lucide-react';
import { useState } from 'react';

function Dashboard() {
    const user = usePage().props.auth.user;

    const { periods, topProducts, inventoryStatus, inventoryValue, productCount } =
        usePage<PageProps & DashboardProps>().props;

    const [period, setPeriod] = useState<PeriodKey>('last30');
    const current: PeriodData = periods[period];
    const notSynced = current.stale || current.fullyUnsynced;

    const fullValue = (value: number) =>
        formatCurrency(value) !== formatCompactCurrency(value)
            ? formatCurrency(value)
            : undefined;

    const margin = current.revenue > 0 ? Math.round((current.profit / current.revenue) * 100) : 0;

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
                    <PerformanceChart
                        data={current.series}
                        description={`Expenses vs profit · ${current.label}`}
                    />
                    <TopSellingTable products={topProducts} />
                </div>

                <div className="flex flex-col gap-6 lg:col-span-2">
                    <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2">
                        <StatCard
                            label="Total Revenue"
                            value={notSynced ? '—' : formatCompactCurrency(current.revenue)}
                            sub={notSynced ? 'Not synced' : current.range}
                            subTooltip={notSynced ? undefined : current.rangeFull}
                            subClassName={notSynced ? 'text-amber-600' : undefined}
                            icon={Banknote}
                            tooltip={notSynced ? undefined : fullValue(current.revenue)}
                        />
                        <StatCard
                            label="Total Orders"
                            value={notSynced ? '—' : formatNumber(current.orders)}
                            sub={notSynced ? 'Not synced' : `Avg ${formatNumber(Math.round(current.orders / Math.max(current.dayCount, 1)))} per day`}
                            subClassName={notSynced ? 'text-amber-600' : undefined}
                            icon={ShoppingBag}
                        />
                        <StatCard
                            label="Gross Profit"
                            value={notSynced ? '—' : formatCompactCurrency(current.profit)}
                            sub={notSynced ? 'Not synced' : `${margin}% margin`}
                            subClassName={notSynced ? 'text-amber-600' : undefined}
                            icon={TrendingUp}
                            tooltip={notSynced ? undefined : fullValue(current.profit)}
                        />
                        <StatCard
                            label="Inventory Value"
                            value={formatCompactCurrency(inventoryValue)}
                            sub={`${productCount} products`}
                            icon={Boxes}
                            tooltip={fullValue(inventoryValue)}
                        />
                    </div>

                    <InventoryDonut status={inventoryStatus} />
                </div>
            </div>
        </SidebarLayout>
    );
}

export default Dashboard;
