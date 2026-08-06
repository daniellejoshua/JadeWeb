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
    products,
    revenueInRange,
    salesInRange,
} from '@/data/mock';
import { formatCurrency, formatNumber } from '@/lib/format';
import { Banknote, Boxes, ShoppingBag, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const rangeOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 14, label: 'Last 14 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 90 days' },
];

function Dashboard() {
    const [days, setDays] = useState(30);

    const revenue = revenueInRange(30);
    const orders = salesInRange(30).length;

    const dateRange = (
        <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
            <SelectTrigger className="h-9 w-[140px] rounded-full border-border/60 shadow-none">
                <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
                {rangeOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
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
                    <PerformanceChart days={days} />
                    <TopSellingTable />
                </div>

                <div className="flex flex-col gap-6 lg:col-span-2">
                    <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2">
                        <StatCard
                            label="Total Revenue"
                            value={formatCurrency(revenue)}
                            sub="Last 30 days"
                            icon={Banknote}
                        />
                        <StatCard
                            label="Total Orders"
                            value={formatNumber(orders)}
                            sub={`${formatNumber(salesInRange(7).length)} this week`}
                            icon={ShoppingBag}
                        />
                        <StatCard
                            label="Gross Profit"
                            value={formatCurrency(revenue * grossMargin)}
                            sub={`${Math.round(grossMargin * 100)}% margin`}
                            icon={TrendingUp}
                        />
                        <StatCard
                            label="Inventory Value"
                            value={formatCurrency(inventoryValue())}
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
