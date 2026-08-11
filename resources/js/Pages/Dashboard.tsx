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
                            value={formatCompactCurrency(current.revenue)}
                            sub={current.range}
                            icon={Banknote}
                            tooltip={fullValue(current.revenue)}
                        />
                        <StatCard
                            label="Total Orders"
                            value={formatNumber(current.orders)}
                            sub={`Avg ${formatNumber(Math.round(current.orders / Math.max(current.dayCount, 1)))} per day`}
                            icon={ShoppingBag}
                        />
                        <StatCard
                            label="Gross Profit"
                            value={formatCompactCurrency(current.profit)}
                            sub={`${margin}% margin`}
                            icon={TrendingUp}
                            tooltip={fullValue(current.profit)}
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
                    <AiAssistantCard />
                </div>
            </div>
        </SidebarLayout>
    );
}

export default Dashboard;