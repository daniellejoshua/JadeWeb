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
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { getRevenueSeries, periodLabels, type PeriodKey, type RevenuePoint } from '@/data/mock';
import { formatCurrency } from '@/lib/format';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { ReactNode } from 'react';

const chartConfig = {
    expense: {
        label: 'Expenses',
        color: 'var(--chart-2)',
    },
    profit: {
        label: 'Profit',
        color: 'var(--gold)',
    },
} satisfies ChartConfig;

function PerformanceTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: RevenuePoint }>;
}) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;

    return (
        <div className="min-w-48 rounded-2xl border border-border/50 bg-popover p-3 text-xs shadow-xl">
            <div className="mb-2.5 flex items-center justify-between gap-6">
                <span className="font-semibold text-foreground">{point.date}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {point.orders} orders
                </span>
            </div>
            <div className="grid gap-1.5">
                {(
                    [
                        { label: 'Profit', value: point.profit, color: 'var(--color-profit)' },
                        { label: 'Expenses', value: point.expense, color: 'var(--color-expense)' },
                    ] as const
                ).map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: row.color }}
                            />
                            {row.label}
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">
                            {formatCurrency(row.value)}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-6 border-t border-border/60 pt-2">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(point.revenue)}
                </span>
            </div>
        </div>
    );
}

type PerformanceChartProps = {
    period: PeriodKey;
    action?: ReactNode;
};

function PerformanceChart({ period, action }: PerformanceChartProps) {
    const data = getRevenueSeries(period);
    const tickInterval = Math.max(0, Math.ceil(data.length / 9) - 1);

    return (
        <DashboardCard>
            <CardHeader className="gap-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle>Performance Overview</CardTitle>
                        <CardDescription>Expenses vs profit · {periodLabels[period]}</CardDescription>
                    </div>
                    {action && <CardAction>{action}</CardAction>}
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-72 w-full">
                    <AreaChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                        <defs>
                            <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-profit)" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="var(--color-profit)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} className="stroke-border/60" />
                        <XAxis
                            dataKey="date"
                            interval={tickInterval}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fontSize: 12 }}
                            minTickGap={16}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            width={56}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `₱${Number(value) / 1000}k`}
                        />
                        <ChartTooltip
                            cursor={{ stroke: 'var(--color-profit)', strokeOpacity: 0.2 }}
                            content={<PerformanceTooltip />}
                        />
                        <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            stackId="performance"
                            stroke="var(--color-expense)"
                            strokeWidth={2}
                            fill="url(#fillExpense)"
                        />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            stackId="performance"
                            stroke="var(--color-profit)"
                            strokeWidth={2}
                            fill="url(#fillProfit)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </DashboardCard>
    );
}

export default PerformanceChart;
