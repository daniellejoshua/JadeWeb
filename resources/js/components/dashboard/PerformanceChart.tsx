import DashboardCard from '@/components/dashboard/DashboardCard';
import {
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardAction,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { getRevenueSeries } from '@/data/mock';
import { formatCurrency } from '@/lib/format';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { ReactNode } from 'react';

const chartConfig = {
    revenue: {
        label: 'Revenue',
        color: 'var(--jade)',
    },
} satisfies ChartConfig;

type PerformanceChartProps = {
    days: number;
    action?: ReactNode;
};

function PerformanceChart({ days, action }: PerformanceChartProps) {
    const data = getRevenueSeries(days);

    return (
        <DashboardCard>
            <CardHeader className="gap-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle>Performance Overview</CardTitle>
                        <CardDescription>Revenue for the last {days} days</CardDescription>
                    </div>
                    {action && <CardAction>{action}</CardAction>}
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-72 w-full">
                    <AreaChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                        <defs>
                            <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} className="stroke-border/60" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            width={56}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `₱${Number(value) / 1000}k`}
                        />
                        <ChartTooltip
                            cursor={{ stroke: 'var(--color-revenue)', strokeOpacity: 0.2 }}
                            content={
                                <ChartTooltipContent
                                    formatter={(value) => formatCurrency(Number(value))}
                                />
                            }
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-revenue)"
                            strokeWidth={2.5}
                            fill="url(#fillRevenue)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </DashboardCard>
    );
}

export default PerformanceChart;
