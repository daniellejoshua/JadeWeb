<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class DashboardMetrics
{
    private const DB_OUTAGE_KEY = 'dashboard.db_unreachable';

    private const RAW_TTL = 3600;

    private const SNAPSHOT_TTL = 3600;

    private bool $unavailable = false;

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
        $now = Carbon::now();

        if ($this->guard()) {
            return $this->degraded($now);
        }

        try {
            $raw = $this->rawData();
            $lastData = Carbon::parse($raw['referenceDay']);
            $lastSync = Carbon::parse($raw['lastSync']);
        } catch (Throwable) {
            $this->markDown();

            return $this->degraded($now);
        }

        return $this->buildPeriods($raw['daily'], $raw['profitByDay'], $raw['hourly'], $now, $lastData, $lastSync);
    }

    private function rawData(): array
    {
        return Cache::remember('dashboard.raw.'.$this->syncId(), self::RAW_TTL, function () {
            $daily = $this->dailyRevenueOrders();

            return [
                'daily' => $daily,
                'profitByDay' => $this->dailyProfit(),
                'hourly' => $this->hourlyForToday(),
                'referenceDay' => $this->referenceDate($daily)->toDateTimeString(),
                'lastSync' => $this->lastSyncDate()->toDateTimeString(),
            ];
        });
    }

    private function guard(): bool
    {
        return Cache::get(self::DB_OUTAGE_KEY, false);
    }

    private function markDown(): void
    {
        $this->unavailable = true;
        Cache::put(self::DB_OUTAGE_KEY, true, now()->addMinute());
    }

    private function degraded(Carbon $now): array
    {
        $this->unavailable = true;

        return $this->buildPeriods([], [], ['revenue' => [], 'profit' => []], $now, $now, $now);
    }

    private function buildPeriods(array $daily, array $profitByDay, array $hourlyToday, Carbon $now, Carbon $lastData, Carbon $lastSync): array
    {
        $periods = [];
        foreach (self::PERIOD_KEYS as $key) {
            $periods[$key] = $this->period($key, $daily, $profitByDay, $hourlyToday, $now, $lastData, $lastSync);
        }

        return $periods;
    }

    private function lastSyncDate(): Carbon
    {
        $last = DB::table('sync_log')->orderByDesc('id')->value('completed_at');

        return $last ? Carbon::parse($last) : Carbon::now();
    }

    private function referenceDate(array $daily = []): Carbon
    {
        if ($daily) {
            return Carbon::parse(max(array_column($daily, 'day')))->startOfDay();
        }

        $last = DB::table('sync_log')->orderByDesc('id')->value('completed_at');

        return $last ? Carbon::parse($last) : Carbon::now();
    }

    public function topProducts(int $limit = 5): array
    {
        return Cache::remember('dashboard.top_products.'.$this->syncId(), self::SNAPSHOT_TTL, function () use ($limit) {
            return $this->topProductsUnCached($limit);
        });
    }

    public function topProductsUnCached(int $limit = 5): array
    {
        if ($this->guard()) {
            return [];
        }

        try {
            $storeName = DB::table('company_settings')->value('company_name') ?? 'Jade Clinic';

            return DB::table('sale_items as si')
                ->join('sales as s', 's.id', '=', 'si.sale_id')
                ->join('products as p', 'p.id', '=', 'si.product_id')
                ->where('s.sale_date', '>=', $this->referenceDate()->startOfMonth())
                ->where(function ($q) {
                    $q->where('s.status', 'NOT ILIKE', 'Aborted');
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
        } catch (Throwable) {
            $this->markDown();

            return [];
        }
    }

    public function inventoryStatus(): array
    {
        return Cache::remember('dashboard.inventory_status.'.$this->syncId(), self::SNAPSHOT_TTL, function () {
            return $this->inventoryStatusUnCached();
        });
    }

    public function inventoryStatusUnCached(): array
    {
        if ($this->guard()) {
            return ['inStock' => 0, 'lowStock' => 0, 'outOfStock' => 0];
        }

        try {
            return [
                'inStock' => DB::table('products')->whereColumn('current_stock', '>', 'reorder_level')->count(),
                'lowStock' => DB::table('products')->where('current_stock', '>', 0)->whereColumn('current_stock', '<=', 'reorder_level')->count(),
                'outOfStock' => DB::table('products')->where('current_stock', '<=', 0)->count(),
            ];
        } catch (Throwable) {
            $this->markDown();

            return ['inStock' => 0, 'lowStock' => 0, 'outOfStock' => 0];
        }
    }

    public function inventoryValue(): float
    {
        return Cache::remember('dashboard.inventory_value.'.$this->syncId(), self::SNAPSHOT_TTL, function () {
            return $this->inventoryValueUnCached();
        });
    }

    public function inventoryValueUnCached(): float
    {
        if ($this->guard()) {
            return 0.0;
        }

        try {
            return round((float) DB::table('products')->selectRaw('SUM(current_stock * cost_price) as v')->value('v'), 2);
        } catch (Throwable) {
            $this->markDown();

            return 0.0;
        }
    }

    public function productCount(): int
    {
        return Cache::remember('dashboard.product_count.'.$this->syncId(), self::SNAPSHOT_TTL, function () {
            return $this->productCountUnCached();
        });
    }

    public function productCountUnCached(): int
    {
        if ($this->guard()) {
            return 0;
        }

        try {
            return DB::table('products')->count();
        } catch (Throwable) {
            $this->markDown();

            return 0;
        }
    }

    private function period(string $key, array $daily, array $profitByDay, array $hourlyToday, Carbon $now, Carbon $lastData, Carbon $lastSync): array
    {
        [$start, $end] = $this->window($key, $daily, $now);
        $days = (int) $start->diffInDays($end) + 1;

        $granularity = $key === 'today' ? 'hour'
            : ($key === 'allTime' ? 'month'
                : ($days <= 31 ? 'day' : ($days <= 180 ? 'week' : 'month')));

        $series = $this->unavailable ? [] : ($granularity === 'hour'
            ? $this->bucketHourly($hourlyToday, $lastSync)
            : $this->bucketDaily($daily, $profitByDay, $start, $end, $granularity, $lastSync));

        return [
            'label' => self::PERIOD_LABELS[$key],
            'stale' => $this->unavailable || ($key === 'today' && ! $lastData->isToday()),
            'hasUnsynced' => $this->unavailable || in_array(false, array_column($series, 'synced'), true),
            'range' => $key === 'today'
                ? 'As of '.$lastData->format('M j')
                : ($start->isSameDay($end)
                    ? $start->format('M j')
                    : ($start->isSameYear($end)
                        ? $start->format('M j').' – '.$end->format('M j')
                        : $start->format('M j, y').' – '.$end->format('M j, y'))),
            'rangeFull' => $key === 'today'
                ? 'As of '.$lastData->format('M j, Y')
                : ($start->isSameDay($end)
                    ? $start->format('M j, Y')
                    : $start->format('M j, Y').' – '.$end->format('M j, Y')),
            'series' => $series,
            'revenue' => round(array_sum(array_column($series, 'revenue')), 2),
            'profit' => round(array_sum(array_column($series, 'profit')), 2),
            'orders' => array_sum(array_column($series, 'orders')),
            'dayCount' => max(1, $days),
        ];
    }

    private function window(string $key, array $daily, Carbon $now): array
    {
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

                return [$min->copy()->startOfDay(), $now->copy()->endOfDay()];
        }

        return [$now->copy()->startOfDay(), $now->copy()->endOfDay()];
    }

    private function dailyRevenueOrders(): array
    {
        return DB::table('sales')
            ->selectRaw("date_trunc('day', sale_date)::date as day, SUM(total_amount)::numeric as revenue, COUNT(*)::int as orders")
            ->where(function ($q) {
                $q->where('status', 'NOT ILIKE', 'Aborted');
            })
            ->groupBy('day')->orderBy('day')
            ->get()->map(fn ($r) => [
                'day' => $r->day,
                'revenue' => (float) $r->revenue,
                'orders' => (int) $r->orders,
            ])->keyBy('day')->toArray();
    }

    private function dailyProfit(): array
    {
        return DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->selectRaw('s.sale_date::date as day, SUM(si.quantity * (si.unit_price - p.cost_price))::numeric as profit')
            ->where(function ($q) {
                $q->where('s.status', 'NOT ILIKE', 'Aborted');
            })
            ->groupBy('day')->orderBy('day')
            ->get()->map(fn ($r) => [
                'day' => $r->day,
                'profit' => (float) $r->profit,
            ])->keyBy('day')->toArray();
    }

    private function hourlyForToday(): array
    {
        $since = Carbon::now()->startOfDay();

        $revenue = DB::table('sales')
            ->selectRaw("date_trunc('hour', sale_date) as hour, SUM(total_amount)::numeric as revenue, COUNT(*)::int as orders")
            ->where('sale_date', '>=', $since)
            ->where(function ($q) {
                $q->where('status', 'NOT ILIKE', 'Aborted');
            })
            ->groupBy('hour')->orderBy('hour')
            ->get()->map(fn ($r) => [
              'hour' => $r->hour,
              'revenue' => (float) $r->revenue,
              'orders' => (int) $r->orders,
          ])->keyBy('hour')->toArray();

        $profit = DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->selectRaw("date_trunc('hour', s.sale_date) as hour, SUM(si.quantity * (si.unit_price - p.cost_price))::numeric as profit")
            ->where('s.sale_date', '>=', $since)
            ->where(function ($q) {
                $q->where('s.status', 'NOT ILIKE', 'Aborted');
            })
            ->groupBy('hour')->orderBy('hour')
            ->get()->map(fn ($r) => [
                'hour' => $r->hour,
                'profit' => (float) $r->profit,
            ])->keyBy('hour')->toArray();

        return ['revenue' => $revenue, 'profit' => $profit];
    }

    private function bucketDaily(array $daily, array $profitByDay, Carbon $start, Carbon $end, string $granularity, Carbon $lastSync): array
    {
        $buckets = [];

        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $bucketStart = $this->bucketStart($cursor, $granularity);
            $key = $this->bucketKey($bucketStart, $granularity);
            if (! isset($buckets[$key])) {
                $buckets[$key] = ['date' => $this->bucketLabel($bucketStart, $granularity), 'revenue' => 0.0, 'profit' => 0.0, 'orders' => 0, 'synced' => $bucketStart->lte($lastSync)];
            }
            $cursor = match ($granularity) {
                'week' => $cursor->addDays(7),
                'month' => $cursor->addMonthNoOverflow(),
                default => $cursor->addDay(),
            };
        }

        foreach ($daily as $dayKey => $row) {
            $day = Carbon::parse($dayKey);
            if ($day->lt($start) || $day->gt($end)) {
                continue;
            }

            $key = $this->bucketKey($this->bucketStart($day, $granularity), $granularity);
            $buckets[$key]['revenue'] += (float) $row['revenue'];
            $buckets[$key]['orders'] += (int) $row['orders'];
            $buckets[$key]['profit'] += (float) ($profitByDay[$dayKey]['profit'] ?? 0);
        }

        ksort($buckets);

        return array_map(fn ($b) => [
            'date' => $b['date'],
            'revenue' => round($b['revenue'], 2),
            'expense' => round($b['revenue'] - $b['profit'], 2),
            'profit' => round($b['profit'], 2),
            'orders' => $b['orders'],
            'synced' => (bool) $b['synced'],
        ], array_values($buckets));
    }

    private function bucketHourly(array $hourlyToday, Carbon $lastSync): array
    {
        return array_map(fn ($hour, $row) => [
            'date' => Carbon::parse($hour)->format('g A'),
            'revenue' => round((float) $row['revenue'], 2),
            'expense' => round((float) $row['revenue'] - (float) ($hourlyToday['profit'][$hour]['profit'] ?? 0), 2),
            'profit' => round((float) ($hourlyToday['profit'][$hour]->profit ?? 0), 2),
            'orders' => (int) $row['orders'],
            'synced' => Carbon::parse($hour)->lte($lastSync),
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

    // CACHING

    private function syncId(): string
    {
        return Cache::remember('dashboard.sync_id', 60, function () {
            return (string) (DB::table('sync_log')->orderByDesc('id')->value('id') ?? 'none');
        });
    }
}
