import DashboardCard from '@/components/dashboard/DashboardCard';
import {
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { inventoryStatus } from '@/data/mock';
import { Cell, Pie, PieChart } from 'recharts';

const chartConfig = {
    inStock: { label: 'In Stock', color: 'var(--jade)' },
    lowStock: { label: 'Low Stock', color: 'oklch(0.795 0.184 86.047)' },
    outOfStock: { label: 'Out of Stock', color: 'var(--destructive)' },
} satisfies ChartConfig;

const data = [
    { name: 'inStock', label: 'In Stock', value: inventoryStatus.inStock, color: 'var(--jade)' },
    { name: 'lowStock', label: 'Low Stock', value: inventoryStatus.lowStock, color: 'oklch(0.795 0.184 86.047)' },
    { name: 'outOfStock', label: 'Out of Stock', value: inventoryStatus.outOfStock, color: 'var(--destructive)' },
];

const total = data.reduce((sum, item) => sum + item.value, 0);

function InventoryDonut() {
    return (
        <DashboardCard>
            <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Stock levels across {total} products</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="relative">
                    <ChartContainer config={chartConfig} className="mx-auto aspect-square w-44">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="label"
                                innerRadius={54}
                                outerRadius={78}
                                paddingAngle={3}
                                strokeWidth={0}
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-semibold tracking-tight">{total}</span>
                        <span className="text-xs text-muted-foreground">Products</span>
                    </div>
                </div>

                <ul className="flex w-full min-w-0 flex-col gap-3">
                    {data.map((item) => {
                        const pct = total ? Math.round((item.value / total) * 100) : 0;
                        return (
                            <li key={item.name} className="flex items-center gap-3">
                                <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="flex-1 text-sm">{item.label}</span>
                                <span className="text-sm font-semibold tabular-nums">{item.value}</span>
                                <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                                    {pct}%
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </DashboardCard>
    );
}

export default InventoryDonut;
