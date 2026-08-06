import SidebarLayout from '@/Layouts/SidebarLayout';
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
    products,
    revenueInRange,
    salesInRange,
    type PeriodKey,
} from '@/data/mock';
import { formatCompactCurrency, formatCurrency, formatNumber } from '@/lib/format';
import { Banknote, Boxes, ShoppingBag, TrendingUp } from 'lucide-react';
import { useState } from 'react';

function Dashboard() {
    const [period, setPeriod] = useState<PeriodKey>('last30');

    const revenue = revenueInRange(period);
    const orders = salesInRange(period).length;
    const dayCount = periodDayCount(period);

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
            subtitle="Welcome back — here's what's happening at Jade Clinic today"
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
                            sub={periodLabels[period]}
                            icon={Banknote}
                        />
                        <StatCard
                            label="Total Orders"
                            value={formatNumber(orders)}
                            sub={`Avg ${formatNumber(Math.round(orders / Math.max(dayCount, 1)))} per day`}
                            icon={ShoppingBag}
                        />
                        <StatCard
                            label="Gross Profit"
                            value={formatCompactCurrency(revenue * grossMargin)}
                            sub={`${Math.round(grossMargin * 100)}% margin`}
                            icon={TrendingUp}
                        />
                        <StatCard
                            label="Inventory Value"
                            value={formatCompactCurrency(inventoryValue())}
                            sub={`${products.length} products`}
                            icon={Boxes}
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
