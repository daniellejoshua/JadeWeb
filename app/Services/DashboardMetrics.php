<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardMetrics
{
    public const PERIOD_KEYS = ['today', 'last7', 'last30', 'thisMonth', 'lastMonth', 'thisYear', 'allTime'];

    public const PERIOD_LABELS = [
        'today' => 'Today',
        'last7' => 'Last 7 days',
        'last30' => 'Last 30 days',
        'thisMonth' => 'This Month',
        'lastMonth' => 'Last Month',
        'thisYear' => 'This Year',
        'allTime' => 'All time',
    ];

    public function periods(): array
    {
        $daily = $this->dailyRevenueOrders();
        $profitByDay = $this->dailyProfit();
        $hourlyToday = $this->hourlyForToday();

        $periods = [];
        foreach (self::PERIOD_KEYS as $key) {
            $periods[$key] = $this->period($key, $daily, $profitByDay, $hourlyToday);
        }
        return $periods;
    }

    public function topProducts(int $limit = 5): array
{
    $storeName = DB::table('company_settings')->value('company_name') ?? 'Jade Clinic';

    return DB::table('sale_items as si')
        ->join('sales as s', 's.id', '=', 'si.sale_id')
        ->join('products as p', 'p.id', '=', 'si.product_id')
        ->where('s.sale_date', '>=', Carbon::now()->startOfMonth())
        ->where(function ($q) {
            $q->where('s.is_void', '!=', true)->where('s.status', 'NOT ILIKE', 'Void');
        })
        ->select('p.id', 'p.product_name', 'p.category', 'p.image_url')
        ->selectRaw('SUM(si.quantity) as quantity_sold')
        ->selectRaw('SUM(si.quantity * si.unit_price) as revenue')
        ->groupBy('p.id', 'p.product_name', 'p.category', 'p.image_url')
        ->orderByDesc('revenue')
        ->limit($limit)
        ->get()
        ->map(fn ($row) => [
            'id' => (int) $row->id,
            'product_name' => $row->product_name,
            'category' => $row->category,
            'store' => $storeName,
            'image_url' => $row->image_url,
            'quantity_sold' => (int) $row->quantity_sold,
            'revenue' => round((float) $row->revenue, 2),
        ])
        ->all();
}

    public function inventoryStatus(): array
    {
        return [
            'inStock' => DB::table('products')->whereColumn('current_stock', '>', 'reorder_level')->count(),
            'lowStock' => DB::table('products')->where('current_stock', '>', 0)->whereColumn('current_stock', '<=', 'reorder_level')->count(),
            'outOfStock' => DB::table('products')->where('current_stock', '<=', 0)->count(),
        ];
    }

    public function inventoryValue(): float
    {
        return round((float) DB::table('products')->selectRaw('SUM(current_stock * cost_price) as v')->value('v'), 2);
    }

    public function productCount(): int
    {
        return DB::table('products')->count();
    }

    private function period(string $key, array $daily, array $profitByDay, array $hourlyToday): array
    {
        $now = Carbon::now();
        [$start, $end] = $this->window($key, $daily);
        $days = (int) $start->diffInDays($end) + 1;

        $granularity = $key === 'today' ? 'hour'
            : ($key === 'allTime' ? 'month'
                : ($days <= 31 ? 'day' : ($days <= 180 ? 'week' : 'month')));

        $series = $granularity === 'hour'
            ? $this->bucketHourly($hourlyToday)
            : $this->bucketDaily($daily, $profitByDay, $start, $end, $granularity);

       return [
    'label' => self::PERIOD_LABELS[$key],
    'range' => $start->isSameDay($end)
        ? $start->format('M j, Y')
        : $start->format('M j, Y') . ' – ' . $end->format('M j, Y'),
    'series' => $series,
    'revenue' => round(array_sum(array_column($series, 'revenue')), 2),
    'profit' => round(array_sum(array_column($series, 'profit')), 2),
    'orders' => array_sum(array_column($series, 'orders')),
    'dayCount' => max(1, $days),
];
    }

    private function window(string $key, array $daily): array
    {
        $now = Carbon::now();
        switch ($key) {
            case 'today':
                return [$now->copy()->startOfDay(), $now->copy()->endOfDay()];
            case 'last7':
                return [$now->copy()->subDays(6)->startOfDay(), $now->copy()->endOfDay()];
            case 'last30':
                return [$now->copy()->subDays(29)->startOfDay(), $now->copy()->endOfDay()];
            case 'thisMonth':
                return [$now->copy()->startOfMonth(), $now->copy()->endOfDay()];
            case 'lastMonth':
                return [$now->copy()->subMonthNoOverflow()->startOfMonth(), $now->copy()->subMonthNoOverflow()->endOfMonth()];
            case 'thisYear':
                return [$now->copy()->startOfYear(), $now->copy()->endOfDay()];
            case 'allTime':
                $days = array_column($daily, 'day');
                $min = $days ? Carbon::parse(min($days)) : $now->copy()->startOfYear();
                $max = $days ? Carbon::parse(max($days)) : $now;
                return [$min->copy()->startOfDay(), $max->copy()->endOfDay()];
        }
        return [$now->copy()->startOfDay(), $now->copy()->endOfDay()];
    }

    private function dailyRevenueOrders(): array
    {
        return DB::table('sales')
            ->selectRaw("date_trunc('day', sale_date)::date as day, SUM(total_amount)::numeric as revenue, COUNT(*)::int as orders")
            ->where(function ($q) {
                $q->where('is_void', '!=', true)->where('status', 'NOT ILIKE', 'Void');
            })
            ->groupBy('day')->orderBy('day')
            ->get()->keyBy('day')->toArray();
    }

    private function dailyProfit(): array
    {
        return DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->selectRaw('s.sale_date::date as day, SUM(si.quantity * (si.unit_price - p.cost_price))::numeric as profit')
            ->where(function ($q) {
                $q->where('s.is_void', '!=', true)->where('s.status', 'NOT ILIKE', 'Void');
            })
            ->groupBy('day')->orderBy('day')
            ->get()->keyBy('day')->toArray();
    }

    private function hourlyForToday(): array
    {
        $since = Carbon::now()->startOfDay();

        $revenue = DB::table('sales')
            ->selectRaw("date_trunc('hour', sale_date) as hour, SUM(total_amount)::numeric as revenue, COUNT(*)::int as orders")
            ->where('sale_date', '>=', $since)
            ->where(function ($q) {
                $q->where('is_void', '!=', true)->where('status', 'NOT ILIKE', 'Void');
            })
            ->groupBy('hour')->orderBy('hour')
            ->get()->keyBy('hour')->toArray();

        $profit = DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->selectRaw("date_trunc('hour', s.sale_date) as hour, SUM(si.quantity * (si.unit_price - p.cost_price))::numeric as profit")
            ->where('s.sale_date', '>=', $since)
            ->where(function ($q) {
                $q->where('s.is_void', '!=', true)->where('s.status', 'NOT ILIKE', 'Void');
            })
            ->groupBy('hour')->orderBy('hour')
            ->get()->keyBy('hour')->toArray();

        return ['revenue' => $revenue, 'profit' => $profit];
    }

    private function bucketDaily(array $daily, array $profitByDay, Carbon $start, Carbon $end, string $granularity): array
    {
        $buckets = [];
        foreach ($daily as $dayKey => $row) {
            $day = Carbon::parse($dayKey);
            if ($day->lt($start) || $day->gt($end)) continue;

            $bucketStart = $this->bucketStart($day, $granularity);
            $key = $this->bucketKey($bucketStart, $granularity);

            if (! isset($buckets[$key])) {
                $buckets[$key] = ['date' => $this->bucketLabel($bucketStart, $granularity), 'revenue' => 0.0, 'profit' => 0.0, 'orders' => 0];
            }
            $buckets[$key]['revenue'] += (float) $row->revenue;
            $buckets[$key]['orders'] += (int) $row->orders;
            $buckets[$key]['profit'] += (float) ($profitByDay[$dayKey]->profit ?? 0);
        }

        ksort($buckets);
        return array_map(fn ($b) => [
            'date' => $b['date'],
            'revenue' => round($b['revenue'], 2),
            'expense' => round($b['revenue'] - $b['profit'], 2),
            'profit' => round($b['profit'], 2),
            'orders' => $b['orders'],
        ], array_values($buckets));
    }

    private function bucketHourly(array $hourlyToday): array
    {
        return array_map(fn ($hour, $row) => [
            'date' => Carbon::parse($hour)->format('g A'),
            'revenue' => round((float) $row->revenue, 2),
            'expense' => round((float) $row->revenue - (float) ($hourlyToday['profit'][$hour]->profit ?? 0), 2),
            'profit' => round((float) ($hourlyToday['profit'][$hour]->profit ?? 0), 2),
            'orders' => (int) $row->orders,
        ], array_keys($hourlyToday['revenue']), array_values($hourlyToday['revenue']));
    }

    private function bucketStart(Carbon $day, string $granularity): Carbon
    {
        return match ($granularity) {
            'week' => $day->copy()->startOfWeek(Carbon::MONDAY),
            'month' => $day->copy()->startOfMonth(),
            'hour' => $day->copy()->startOfHour(),
            default => $day->copy()->startOfDay(),
        };
    }

    private function bucketKey(Carbon $start, string $granularity): string
    {
        return match ($granularity) {
            'week' => $start->format('o-W'),
            'month' => $start->format('Y-m'),
            'hour' => $start->format('Y-m-d H'),
            default => $start->format('Y-m-d'),
        };
    }

    private function bucketLabel(Carbon $start, string $granularity): string
    {
        return match ($granularity) {
            'month' => $start->format('M Y'),
            'hour' => $start->format('g A'),
            default => $start->format('M j'),
        };
    }
}