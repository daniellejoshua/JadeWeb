<?php

namespace App\Services\Assistant;

use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Throwable;

class AnalyticsTools
{
    public const PERIODS = ['today', 'last7', 'last30', 'this_month', 'last_month', 'this_year'];

    private const TIMEZONE = 'Asia/Manila';

    private const MIN_STAFF_COHORT = 3;

    private ?CarbonImmutable $sourceAsOf = null;

    public function definitions(): array
    {
        $period = ['type' => 'string', 'enum' => self::PERIODS];
        $granularity = ['type' => 'string', 'enum' => ['hour', 'day', 'week', 'month']];

        return [
            $this->definition('sales_summary', 'Revenue, orders, units, average order value, and estimated gross profit.', ['period' => $period], ['period']),
            $this->definition('payment_breakdown', 'Payment-method order counts for a custom date range, with revenue retained as a supporting metric. Use this for order-count payment-mix pie charts.', [
                'start_date' => ['type' => 'string', 'format' => 'date'],
                'end_date' => ['type' => 'string', 'format' => 'date'],
            ], ['start_date', 'end_date']),
            $this->definition('sales_trend', 'Sales totals grouped over time.', [
                'period' => $period,
                'granularity' => $granularity,
            ], ['period', 'granularity']),
            $this->definition('compare_sales_periods', 'Compare two sales periods.', [
                'current_period' => $period,
                'previous_period' => $period,
            ], ['current_period', 'previous_period']),
            $this->definition('top_products', 'Top products by completed-sales revenue.', [
                'period' => $period,
                'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 10],
            ], ['period', 'limit']),
            $this->definition('staff_summary', 'Current staff headcount grouped by role and active status without identifying individual staff.', [], []),
            $this->definition('staff_sales_by_role', 'Completed-sales totals grouped by current staff role. Cohorts with fewer than three staff are withheld.', [
                'period' => $period,
            ], ['period']),
            $this->definition('staff_sales_ranking', 'Rank individual staff by completed-sales revenue, order count, average order value, or an equal-weight score across all three metrics. Staff identities are renderer-only.', [
                'period' => $period,
                'metric' => ['type' => 'string', 'enum' => ['revenue', 'orders', 'average_order_value', 'all']],
                'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 10],
            ], ['period', 'metric', 'limit']),
            $this->definition('supplier_summary', 'Current supplier status and product-assignment coverage without supplier contact details.', [], []),
            $this->definition('supplier_stock_ins', 'Supplier stock-in totals for a supported period, including units received and estimated value using current product cost.', [
                'period' => $period,
            ], ['period']),
            $this->definition('inventory_summary', 'Current inventory counts and values. Do not use this for stock-movement log history.', [], []),
            $this->definition('stock_alerts', 'Products with low or no stock.', [
                'status' => ['type' => 'string', 'enum' => ['low_stock', 'out_of_stock', 'all']],
                'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 20],
            ], ['status', 'limit']),
            $this->definition('stock_movement_summary', 'Inventory movement-log totals and time trends for IN, OUT, and ADJUST transactions. Quantity is a movement magnitude; net change uses recorded stock bounds.', [
                'period' => $period,
                'granularity' => $granularity,
            ], ['period', 'granularity']),
            $this->definition('top_moved_products', 'Products with the highest inventory movement quantities for a supported period.', [
                'period' => $period,
                'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 10],
            ], ['period', 'limit']),
            $this->definition('recent_inventory_activity', 'Bounded recent inventory movement logs without staff identity, notes, or reference text.', [
                'period' => $period,
                'transaction_type' => ['type' => 'string', 'enum' => ['all', 'IN', 'OUT', 'ADJUST']],
                'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 20],
            ], ['period', 'transaction_type', 'limit']),
            $this->definition('data_freshness', 'Most recent completed database synchronization.', [], []),
        ];
    }

    public function execute(string $name, array $arguments): array
    {
        if (! in_array($name, $this->names(), true)) {
            return $this->failure($name, 'Unknown analytics tool requested.');
        }

        $rules = match ($name) {
            'sales_summary' => ['period' => ['required', Rule::in(self::PERIODS)]],
            'payment_breakdown' => [
                'start_date' => ['required', 'date_format:Y-m-d'],
                'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date', 'before_or_equal:'.CarbonImmutable::now(self::TIMEZONE)->toDateString()],
            ],
            'sales_trend' => [
                'period' => ['required', Rule::in(self::PERIODS)],
                'granularity' => ['required', Rule::in(['hour', 'day', 'week', 'month'])],
            ],
            'compare_sales_periods' => [
                'current_period' => ['required', Rule::in(self::PERIODS)],
                'previous_period' => ['required', Rule::in(self::PERIODS)],
            ],
            'top_products' => ['period' => ['required', Rule::in(self::PERIODS)], 'limit' => ['required', 'integer', 'between:1,10']],
            'staff_sales_by_role' => ['period' => ['required', Rule::in(self::PERIODS)]],
            'staff_sales_ranking' => [
                'period' => ['required', Rule::in(self::PERIODS)],
                'metric' => ['required', Rule::in(['revenue', 'orders', 'average_order_value', 'all'])],
                'limit' => ['required', 'integer', 'between:1,10'],
            ],
            'supplier_stock_ins' => ['period' => ['required', Rule::in(self::PERIODS)]],
            'stock_alerts' => ['status' => ['required', Rule::in(['low_stock', 'out_of_stock', 'all'])], 'limit' => ['required', 'integer', 'between:1,20']],
            'stock_movement_summary' => ['period' => ['required', Rule::in(self::PERIODS)], 'granularity' => ['required', Rule::in(['hour', 'day', 'week', 'month'])]],
            'top_moved_products' => ['period' => ['required', Rule::in(self::PERIODS)], 'limit' => ['required', 'integer', 'between:1,10']],
            'recent_inventory_activity' => [
                'period' => ['required', Rule::in(self::PERIODS)],
                'transaction_type' => ['required', Rule::in(['all', 'IN', 'OUT', 'ADJUST'])],
                'limit' => ['required', 'integer', 'between:1,20'],
            ],
            default => [],
        };

        $validator = Validator::make($arguments, $rules);
        if ($validator->fails()) {
            return $this->failure($name, 'Invalid tool arguments: '.$validator->errors()->first());
        }

        try {
            return match ($name) {
                'sales_summary' => $this->salesSummary($arguments['period']),
                'payment_breakdown' => $this->paymentBreakdown($arguments['start_date'], $arguments['end_date']),
                'sales_trend' => $this->salesTrend($arguments['period'], $arguments['granularity']),
                'compare_sales_periods' => $this->compareSalesPeriods($arguments['current_period'], $arguments['previous_period']),
                'top_products' => $this->topProducts($arguments['period'], (int) $arguments['limit']),
                'staff_summary' => $this->staffSummary(),
                'staff_sales_by_role' => $this->staffSalesByRole($arguments['period']),
                'staff_sales_ranking' => $this->staffSalesRanking($arguments['period'], $arguments['metric'], (int) $arguments['limit']),
                'supplier_summary' => $this->supplierSummary(),
                'supplier_stock_ins' => $this->supplierStockIns($arguments['period']),
                'inventory_summary' => $this->inventorySummary(),
                'stock_alerts' => $this->stockAlerts($arguments['status'], (int) $arguments['limit']),
                'stock_movement_summary' => $this->stockMovementSummary($arguments['period'], $arguments['granularity']),
                'top_moved_products' => $this->topMovedProducts($arguments['period'], (int) $arguments['limit']),
                'recent_inventory_activity' => $this->recentInventoryActivity($arguments['period'], $arguments['transaction_type'], (int) $arguments['limit']),
                'data_freshness' => $this->dataFreshness(),
            };
        } catch (Throwable) {
            return $this->failure($name, 'Business data is currently unavailable.');
        }
    }

    public function names(): array
    {
        return [
            'sales_summary',
            'payment_breakdown',
            'sales_trend',
            'compare_sales_periods',
            'top_products',
            'staff_summary',
            'staff_sales_by_role',
            'staff_sales_ranking',
            'supplier_summary',
            'supplier_stock_ins',
            'inventory_summary',
            'stock_alerts',
            'stock_movement_summary',
            'top_moved_products',
            'recent_inventory_activity',
            'data_freshness',
        ];
    }

    private function salesSummary(string $period): array
    {
        [$start, $end] = $this->window($period);
        $sales = $this->completedSales($start, $end)
            ->selectRaw('COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue, COALESCE(AVG(total_amount), 0) as average_order_value, COALESCE(SUM(discount_amount), 0) as discounts')
            ->first();
        $items = DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->whereBetween('s.sale_date', [$start, $end])
            ->whereRaw('LOWER(s.status) = ?', ['completed'])
            ->selectRaw('COALESCE(SUM(si.quantity), 0) as units_sold, COALESCE(SUM(si.quantity * (si.unit_price - p.cost_price)), 0) as estimated_gross_profit')
            ->first();
        $payments = $this->completedSales($start, $end)
            ->selectRaw("COALESCE(payment_method, 'Unknown') as method, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue")
            ->groupBy('payment_method')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn (object $row) => [
                'method' => (string) $row->method,
                'orders' => (int) $row->orders,
                'revenue' => round((float) $row->revenue, 2),
            ])->all();

        $data = [
            'period' => $period,
            'range' => $this->range($start, $end),
            'revenue' => round((float) $sales->revenue, 2),
            'orders' => (int) $sales->orders,
            'average_order_value' => round((float) $sales->average_order_value, 2),
            'discounts' => round((float) $sales->discounts, 2),
            'units_sold' => (int) $items->units_sold,
            'estimated_gross_profit' => round((float) $items->estimated_gross_profit, 2),
            'payment_breakdown' => $payments,
        ];
        $warnings = ['Estimated gross profit uses each product\'s current cost price, not its historical cost at sale time.'];
        $block = ['type' => 'kpi_grid', 'items' => [
            ['label' => 'Revenue', 'value' => $this->currency($data['revenue'])],
            ['label' => 'Orders', 'value' => $data['orders']],
            ['label' => 'Average order', 'value' => $this->currency($data['average_order_value'])],
            ['label' => 'Estimated gross profit', 'value' => $this->currency($data['estimated_gross_profit'])],
        ]];
        $blocks = [$block];
        if ($payments !== []) {
            $blocks[] = ['type' => 'pie_chart', 'title' => 'Revenue by payment method', 'data' => $payments, 'xKey' => 'method', 'series' => [
                ['key' => 'revenue', 'label' => 'Revenue'],
            ]];
        }

        return $this->success('sales_summary', $period, $data, $blocks, $warnings);
    }

    private function paymentBreakdown(string $startDate, string $endDate): array
    {
        [$start, $end] = $this->dateWindow($startDate, $endDate);
        $rows = $this->completedSales($start, $end)
            ->selectRaw("COALESCE(NULLIF(TRIM(payment_method), ''), 'Unknown') as method, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue")
            ->groupBy('method')
            ->orderByDesc('orders')
            ->orderByDesc('revenue')
            ->get();
        $totalRevenue = round((float) $rows->sum(fn (object $row) => (float) $row->revenue), 2);
        $totalOrders = (int) $rows->sum('orders');
        $payments = $rows->map(fn (object $row) => [
            'method' => (string) $row->method,
            'orders' => (int) $row->orders,
            'order_share_percent' => $totalOrders > 0 ? round(((int) $row->orders / $totalOrders) * 100, 2) : 0.0,
            'revenue' => round((float) $row->revenue, 2),
            'revenue_share_percent' => $totalRevenue > 0 ? round(((float) $row->revenue / $totalRevenue) * 100, 2) : 0.0,
        ])->all();
        $lastSync = $this->latestCompletedSync();
        $warnings = [];
        if ($lastSync === null) {
            $warnings[] = 'No completed data synchronization was found, so this report may be incomplete.';
        } elseif ($endDate > $lastSync->toDateString()) {
            $warnings[] = 'Last synced '.$lastSync->format('Y-m-d H:i T').'. Changes from '.$lastSync->addDay()->toDateString().' through '.$endDate.' may be missing.';
        }
        $data = [
            'range' => $this->range($start, $end),
            'metric' => 'orders',
            'revenue' => $totalRevenue,
            'orders' => $totalOrders,
            'payment_methods' => count($payments),
            'last_completed_sync' => $lastSync?->toIso8601String(),
            'payments' => $payments,
        ];
        $blocks = [[
            'type' => 'kpi_grid',
            'items' => [
                ['label' => 'Revenue', 'value' => $this->currency($totalRevenue)],
                ['label' => 'Orders', 'value' => $totalOrders],
                ['label' => 'Payment methods', 'value' => count($payments)],
            ],
        ]];
        if ($payments !== []) {
            $blocks[] = [
                'type' => 'table',
                'title' => 'Payment-method mix (order share) · '.$startDate.' to '.$endDate,
                'columns' => [
                    ['key' => 'method', 'label' => 'Payment method'],
                    ['key' => 'orders', 'label' => 'Orders'],
                    ['key' => 'order_share_percent', 'label' => 'Order share'],
                    ['key' => 'revenue', 'label' => 'Revenue'],
                    ['key' => 'revenue_share_percent', 'label' => 'Revenue share'],
                ],
                'rows' => $payments,
            ];
            $blocks[] = [
                'type' => 'pie_chart',
                'title' => 'Payment methods by order count · '.$startDate.' to '.$endDate,
                'data' => $payments,
                'xKey' => 'method',
                'series' => [['key' => 'orders', 'label' => 'Orders']],
            ];
        }

        return $this->success('payment_breakdown', $startDate.':'.$endDate, $data, $blocks, $warnings, $lastSync);
    }

    private function salesTrend(string $period, string $granularity): array
    {
        [$start, $end] = $this->window($period);
        $bucket = $this->bucketExpression($granularity);
        $rows = $this->completedSales($start, $end)
            ->selectRaw("$bucket as bucket, COUNT(*) as orders, SUM(total_amount) as revenue")
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->limit(400)
            ->get()
            ->map(fn (object $row) => [
                'period' => (string) $row->bucket,
                'revenue' => round((float) $row->revenue, 2),
                'orders' => (int) $row->orders,
            ])->all();
        $data = ['period' => $period, 'granularity' => $granularity, 'range' => $this->range($start, $end), 'points' => $rows];
        $block = ['type' => 'line_chart', 'title' => 'Sales trend', 'data' => $rows, 'xKey' => 'period', 'series' => [
            ['key' => 'revenue', 'label' => 'Revenue'],
            ['key' => 'orders', 'label' => 'Orders'],
        ]];

        return $this->success('sales_trend', "$period:$granularity", $data, [$block]);
    }

    private function compareSalesPeriods(string $current, string $previous): array
    {
        $currentData = $this->summaryTotals($current);
        $previousData = $this->summaryTotals($previous);
        $revenueChange = $this->percentChange($currentData['revenue'], $previousData['revenue']);
        $ordersChange = $this->percentChange($currentData['orders'], $previousData['orders']);
        $data = [
            'current' => $currentData,
            'previous' => $previousData,
            'revenue_change_percent' => $revenueChange,
            'orders_change_percent' => $ordersChange,
        ];
        $rows = [
            ['metric' => 'Revenue', 'current' => $currentData['revenue'], 'previous' => $previousData['revenue'], 'change_percent' => $revenueChange],
            ['metric' => 'Orders', 'current' => $currentData['orders'], 'previous' => $previousData['orders'], 'change_percent' => $ordersChange],
        ];
        $block = ['type' => 'table', 'title' => 'Sales period comparison', 'columns' => [
            ['key' => 'metric', 'label' => 'Metric'],
            ['key' => 'current', 'label' => 'Current'],
            ['key' => 'previous', 'label' => 'Previous'],
            ['key' => 'change_percent', 'label' => 'Change %'],
        ], 'rows' => $rows];
        $blocks = [$block];
        if ($revenueChange !== null && abs($revenueChange) >= 10) {
            $blocks[] = ['type' => 'recommendations', 'items' => [[
                'title' => $revenueChange < 0 ? 'Review the sales decline' : 'Plan for sustained demand',
                'reason' => 'Revenue changed by '.number_format($revenueChange, 1).'% between the selected periods.',
                'action' => $revenueChange < 0 ? 'Check transaction volume and top-product changes.' : 'Confirm inventory can support the higher sales pace.',
                'severity' => $revenueChange < 0 ? 'attention' : 'opportunity',
            ]]];
        }

        return $this->success('compare_sales_periods', "$current:$previous", $data, $blocks);
    }

    private function topProducts(string $period, int $limit): array
    {
        [$start, $end] = $this->window($period);
        $rows = DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->join('products as p', 'p.id', '=', 'si.product_id')
            ->whereBetween('s.sale_date', [$start, $end])
            ->whereRaw('LOWER(s.status) = ?', ['completed'])
            ->select('p.product_name', 'p.product_code')
            ->selectRaw('SUM(si.quantity) as quantity_sold, SUM(si.quantity * si.unit_price) as revenue')
            ->groupBy('p.id', 'p.product_name', 'p.product_code')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(fn (object $row) => [
                'product_name' => $row->product_name,
                'product_code' => $row->product_code,
                'quantity_sold' => (int) $row->quantity_sold,
                'revenue' => round((float) $row->revenue, 2),
            ])->all();
        $data = ['period' => $period, 'range' => $this->range($start, $end), 'products' => $rows];
        $block = ['type' => 'bar_chart', 'title' => 'Top products by revenue', 'data' => $rows, 'xKey' => 'product_name', 'series' => [['key' => 'revenue', 'label' => 'Revenue']]];

        return $this->success('top_products', "$period:$limit", $data, [$block]);
    }

    private function staffSummary(): array
    {
        $row = DB::table('users')->selectRaw(
            'COUNT(*) as total_staff, '.
            'COALESCE(SUM(CASE WHEN is_active IS NULL THEN 1 ELSE 0 END), 0) as unknown_status, '.
            'COALESCE(SUM(CASE WHEN is_active THEN 1 ELSE 0 END), 0) as active, '.
            'COALESCE(SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END), 0) as inactive'
        )->first();
        $roles = DB::table('users')
            ->selectRaw("COALESCE(NULLIF(TRIM(user_role), ''), 'Unknown') as role, COUNT(*) as staff")
            ->groupBy('role')
            ->orderByDesc('staff')
            ->orderBy('role')
            ->get()
            ->map(fn (object $role) => [
                'role' => (string) $role->role,
                'staff' => (int) $role->staff,
            ])->all();
        $data = [
            'total_staff' => (int) $row->total_staff,
            'active' => (int) $row->active,
            'inactive' => (int) $row->inactive,
            'unknown_status' => (int) $row->unknown_status,
            'roles' => $roles,
        ];
        $blocks = [[
            'type' => 'kpi_grid',
            'items' => [
                ['label' => 'Total staff', 'value' => $data['total_staff']],
                ['label' => 'Active', 'value' => $data['active']],
                ['label' => 'Inactive', 'value' => $data['inactive']],
                ['label' => 'Unknown status', 'value' => $data['unknown_status']],
            ],
        ]];
        if ($roles !== []) {
            $blocks[] = [
                'type' => 'bar_chart',
                'title' => 'Staff by role',
                'data' => $roles,
                'xKey' => 'role',
                'series' => [['key' => 'staff', 'label' => 'Staff']],
            ];
        }

        return $this->success('staff_summary', 'current', $data, $blocks);
    }

    private function staffSalesByRole(string $period): array
    {
        [$start, $end] = $this->window($period);
        $sales = $this->completedSales($start, $end)->leftJoin('users as u', 'u.id', '=', 'sales.user_id');
        $totals = (clone $sales)->selectRaw(
            'COUNT(*) as orders, '.
            'COALESCE(SUM(sales.total_amount), 0) as revenue, '.
            'COUNT(DISTINCT u.id) as active_sellers'
        )->first();
        $unmatched = (clone $sales)->whereNull('u.id')->selectRaw(
            'COUNT(*) as orders, COALESCE(SUM(sales.total_amount), 0) as revenue'
        )->first();
        $roleRows = (clone $sales)
            ->selectRaw(
                "COALESCE(NULLIF(TRIM(u.user_role), ''), 'Unmatched') as role, ".
                'COUNT(DISTINCT sales.user_id) as distinct_staff, '.
                'COUNT(*) as orders, '.
                'COALESCE(SUM(sales.total_amount), 0) as revenue, '.
                'COALESCE(AVG(sales.total_amount), 0) as average_order_value'
            )
            ->groupBy('role')
            ->orderByDesc('orders')
            ->orderBy('role')
            ->get();
        $visibleRows = [];
        $withheldRoles = 0;
        foreach ($roleRows as $role) {
            if ((int) $role->distinct_staff < self::MIN_STAFF_COHORT) {
                $withheldRoles++;

                continue;
            }
            $visibleRows[] = [
                'role' => (string) $role->role,
                'distinct_staff' => (int) $role->distinct_staff,
                'orders' => (int) $role->orders,
                'revenue' => round((float) $role->revenue, 2),
                'average_order_value' => round((float) $role->average_order_value, 2),
            ];
        }
        $data = [
            'period' => $period,
            'range' => $this->range($start, $end),
            'orders' => (int) $totals->orders,
            'revenue' => round((float) $totals->revenue, 2),
            'active_sellers' => (int) $totals->active_sellers,
            'unmatched_orders' => (int) $unmatched->orders,
            'unmatched_revenue' => round((float) $unmatched->revenue, 2),
            'withheld_role_count' => $withheldRoles,
            'role_cohorts' => $visibleRows,
        ];
        $blocks = [[
            'type' => 'kpi_grid',
            'items' => [
                ['label' => 'Orders', 'value' => $data['orders']],
                ['label' => 'Revenue', 'value' => $this->currency($data['revenue'])],
                ['label' => 'Active sellers', 'value' => $data['active_sellers']],
                ['label' => 'Unmatched orders', 'value' => $data['unmatched_orders']],
            ],
        ]];
        if ($visibleRows !== []) {
            $blocks[] = [
                'type' => 'table',
                'title' => 'Completed sales by current staff role',
                'columns' => [
                    ['key' => 'role', 'label' => 'Role'],
                    ['key' => 'distinct_staff', 'label' => 'Staff'],
                    ['key' => 'orders', 'label' => 'Orders'],
                    ['key' => 'revenue', 'label' => 'Revenue'],
                    ['key' => 'average_order_value', 'label' => 'Average order'],
                ],
                'rows' => $visibleRows,
            ];
        }
        $warnings = array_merge([
            'Staff sales use each employee\'s current roster role, not their role at the time of the sale.',
            'Role metrics for cohorts containing fewer than three staff are withheld.',
        ], $this->periodWarnings($end));

        return $this->success('staff_sales_by_role', $period, $data, $blocks, $warnings);
    }

    private function staffSalesRanking(string $period, string $metric, int $limit): array
    {
        [$start, $end] = $this->window($period);
        $staff = DB::table('sales as s')
            ->join('users as u', 'u.id', '=', 's.user_id')
            ->whereBetween('s.sale_date', [$start, $end])
            ->whereRaw('LOWER(s.status) = ?', ['completed'])
            ->select('u.id', 'u.employee_code', 'u.full_name', 'u.user_role', 'u.is_active')
            ->selectRaw('COUNT(*) as orders, COALESCE(SUM(s.total_amount), 0) as revenue, COALESCE(AVG(s.total_amount), 0) as average_order_value')
            ->groupBy('u.id', 'u.employee_code', 'u.full_name', 'u.user_role', 'u.is_active')
            ->get()
            ->map(fn (object $row) => [
                'employee_code' => (string) ($row->employee_code ?: 'JADE-STAFF-'.$row->id),
                'full_name' => (string) $row->full_name,
                'role' => (string) ($row->user_role ?: 'Unknown'),
                'status' => $row->is_active === null ? 'Unknown' : ((bool) $row->is_active ? 'Active' : 'Inactive'),
                'orders' => (int) $row->orders,
                'revenue' => round((float) $row->revenue, 2),
                'average_order_value' => round((float) $row->average_order_value, 2),
            ])->all();

        $maxRevenue = max(array_column($staff, 'revenue') ?: [0]);
        $maxOrders = max(array_column($staff, 'orders') ?: [0]);
        $maxAverageOrder = max(array_column($staff, 'average_order_value') ?: [0]);
        foreach ($staff as &$member) {
            $member['performance_score'] = round((
                ($maxRevenue > 0 ? $member['revenue'] / $maxRevenue : 0)
                + ($maxOrders > 0 ? $member['orders'] / $maxOrders : 0)
                + ($maxAverageOrder > 0 ? $member['average_order_value'] / $maxAverageOrder : 0)
            ) / 3 * 100, 2);
        }
        unset($member);

        $sortKey = $metric === 'all' ? 'performance_score' : $metric;
        usort($staff, function (array $left, array $right) use ($sortKey): int {
            return ($right[$sortKey] <=> $left[$sortKey])
                ?: ($right['revenue'] <=> $left['revenue'])
                ?: ($right['orders'] <=> $left['orders'])
                ?: strcmp($left['full_name'], $right['full_name']);
        });
        $eligibleStaff = count($staff);
        $staff = array_slice($staff, 0, $limit);
        foreach ($staff as $index => &$member) {
            $member = ['rank' => $index + 1, ...$member];
        }
        unset($member);

        $data = [
            'period' => $period,
            'range' => $this->range($start, $end),
            'metric' => $metric,
            'eligible_staff' => $eligibleStaff,
            'returned' => count($staff),
            'individual_results' => 'Renderer-only. Refer to the verified ranking table without identifying or characterizing its leader in the narrative.',
            'scoring_method' => $metric === 'all'
                ? 'Equal-weight normalized score: revenue, completed orders, and average order value each contribute one third.'
                : 'Ranked directly by '.$metric.'.',
        ];
        $columns = [
            ['key' => 'rank', 'label' => 'Rank'],
            ['key' => 'employee_code', 'label' => 'Employee code'],
            ['key' => 'full_name', 'label' => 'Staff'],
            ['key' => 'role', 'label' => 'Role'],
            ['key' => 'status', 'label' => 'Status'],
            ['key' => 'orders', 'label' => 'Orders'],
            ['key' => 'revenue', 'label' => 'Revenue'],
            ['key' => 'average_order_value', 'label' => 'Average order'],
        ];
        if ($metric === 'all') {
            $columns[] = ['key' => 'performance_score', 'label' => 'Overall score'];
        }
        $blocks = [[
            'type' => 'table',
            'title' => 'Staff sales ranking',
            'columns' => $columns,
            'rows' => $staff,
        ]];
        if ($staff !== []) {
            $label = match ($metric) {
                'revenue' => 'Revenue',
                'orders' => 'Completed orders',
                'average_order_value' => 'Average order value',
                default => 'Overall score',
            };
            $blocks[] = [
                'type' => 'bar_chart',
                'title' => 'Staff ranking by '.$label,
                'data' => $staff,
                'xKey' => 'full_name',
                'series' => [['key' => $sortKey, 'label' => $label]],
            ];
        }
        $warnings = array_merge([
            'Staff ranking uses completed sales and each employee\'s current roster role and status.',
            ...($metric === 'all' ? ['Overall score equally weights normalized revenue, completed orders, and average order value.'] : []),
        ], $this->periodWarnings($end));

        return $this->success('staff_sales_ranking', "$period:$metric:$limit", $data, $blocks, $warnings);
    }

    private function supplierSummary(): array
    {
        $row = DB::table('suppliers')->selectRaw(
            'COUNT(*) as total_suppliers, '.
            'COALESCE(SUM(CASE WHEN is_active IS NULL THEN 1 ELSE 0 END), 0) as unknown_status, '.
            'COALESCE(SUM(CASE WHEN is_active THEN 1 ELSE 0 END), 0) as active, '.
            'COALESCE(SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END), 0) as inactive'
        )->first();
        $assignedProducts = DB::table('products as p')
            ->join('suppliers as s', 's.id', '=', 'p.supplier_id')
            ->distinct()
            ->count('p.id');
        $unassignedProducts = DB::table('products as p')
            ->leftJoin('suppliers as s', 's.id', '=', 'p.supplier_id')
            ->whereNull('s.id')
            ->count('p.id');
        $suppliersWithoutProducts = DB::table('suppliers as s')
            ->leftJoin('products as p', 'p.supplier_id', '=', 's.id')
            ->whereNull('p.id')
            ->count('s.id');
        $suppliers = DB::table('suppliers as s')
            ->leftJoin('products as p', 'p.supplier_id', '=', 's.id')
            ->select('s.supplier_code', 's.supplier_name')
            ->selectRaw(
                'COUNT(p.id) as products, '.
                'COALESCE(SUM(CASE WHEN p.current_stock > 0 AND p.current_stock <= p.reorder_level THEN 1 ELSE 0 END), 0) as low_stock, '.
                'COALESCE(SUM(CASE WHEN p.current_stock <= 0 THEN 1 ELSE 0 END), 0) as out_of_stock'
            )
            ->groupBy('s.id', 's.supplier_code', 's.supplier_name')
            ->orderByDesc('products')
            ->orderBy('s.supplier_name')
            ->limit(10)
            ->get()
            ->map(fn (object $supplier) => [
                'supplier_code' => (string) $supplier->supplier_code,
                'supplier_name' => (string) $supplier->supplier_name,
                'products' => (int) $supplier->products,
                'low_stock' => (int) $supplier->low_stock,
                'out_of_stock' => (int) $supplier->out_of_stock,
            ])->all();
        $data = [
            'total_suppliers' => (int) $row->total_suppliers,
            'active' => (int) $row->active,
            'inactive' => (int) $row->inactive,
            'unknown_status' => (int) $row->unknown_status,
            'assigned_products' => (int) $assignedProducts,
            'unassigned_products' => (int) $unassignedProducts,
            'suppliers_without_products' => (int) $suppliersWithoutProducts,
            'suppliers' => $suppliers,
        ];
        $blocks = [[
            'type' => 'kpi_grid',
            'items' => [
                ['label' => 'Suppliers', 'value' => $data['total_suppliers']],
                ['label' => 'Active', 'value' => $data['active']],
                ['label' => 'Inactive', 'value' => $data['inactive']],
                ['label' => 'Unassigned products', 'value' => $data['unassigned_products']],
            ],
        ]];
        if ($suppliers !== []) {
            $blocks[] = [
                'type' => 'bar_chart',
                'title' => 'Products by supplier',
                'data' => $suppliers,
                'xKey' => 'supplier_name',
                'series' => [['key' => 'products', 'label' => 'Products']],
            ];
        }

        return $this->success('supplier_summary', 'current', $data, $blocks);
    }

    private function supplierStockIns(string $period): array
    {
        [$start, $end] = $this->window($period);
        $stockIns = DB::table('inventory_logs as il')
            ->leftJoin('suppliers as s', 's.id', '=', 'il.supplier_id')
            ->leftJoin('products as p', 'p.id', '=', 'il.product_id')
            ->where('il.transaction_type', 'IN')
            ->whereBetween('il.created_at', [$start, $end]);
        $totals = (clone $stockIns)->selectRaw(
            'COUNT(*) as stock_ins, '.
            'COALESCE(SUM(il.quantity), 0) as units_received, '.
            'COALESCE(SUM(il.quantity * p.cost_price), 0) as estimated_value'
        )->first();
        $suppliers = (clone $stockIns)
            ->selectRaw("COALESCE(s.supplier_code, '—') as supplier_code, COALESCE(s.supplier_name, 'Unassigned') as supplier_name")
            ->selectRaw('COUNT(*) as stock_ins, COALESCE(SUM(il.quantity), 0) as units_received, COALESCE(SUM(il.quantity * p.cost_price), 0) as estimated_value')
            ->groupBy('s.supplier_code', 's.supplier_name')
            ->orderByDesc('units_received')
            ->orderBy('supplier_name')
            ->limit(10)
            ->get()
            ->map(fn (object $supplier) => [
                'supplier_code' => (string) $supplier->supplier_code,
                'supplier_name' => (string) $supplier->supplier_name,
                'stock_ins' => (int) $supplier->stock_ins,
                'units_received' => (int) $supplier->units_received,
                'estimated_value' => round((float) $supplier->estimated_value, 2),
            ])->all();
        $data = [
            'period' => $period,
            'range' => $this->range($start, $end),
            'stock_ins' => (int) $totals->stock_ins,
            'units_received' => (int) $totals->units_received,
            'estimated_value' => round((float) $totals->estimated_value, 2),
            'supplier_groups' => count($suppliers),
            'suppliers' => $suppliers,
        ];
        $blocks = [[
            'type' => 'kpi_grid',
            'items' => [
                ['label' => 'Stock-ins', 'value' => $data['stock_ins']],
                ['label' => 'Units received', 'value' => $data['units_received']],
                ['label' => 'Estimated value', 'value' => $this->currency($data['estimated_value'])],
                ['label' => 'Supplier groups', 'value' => $data['supplier_groups']],
            ],
        ]];
        if ($suppliers !== []) {
            $blocks[] = [
                'type' => 'table',
                'title' => 'Supplier stock-ins',
                'columns' => [
                    ['key' => 'supplier_code', 'label' => 'Code'],
                    ['key' => 'supplier_name', 'label' => 'Supplier'],
                    ['key' => 'stock_ins', 'label' => 'Stock-ins'],
                    ['key' => 'units_received', 'label' => 'Units'],
                    ['key' => 'estimated_value', 'label' => 'Estimated value'],
                ],
                'rows' => $suppliers,
            ];
            $blocks[] = [
                'type' => 'bar_chart',
                'title' => 'Units received by supplier',
                'data' => $suppliers,
                'xKey' => 'supplier_name',
                'series' => [['key' => 'units_received', 'label' => 'Units received']],
            ];
        }
        $warnings = array_merge([
            'Estimated stock-in value uses each product\'s current cost price, not its historical cost at receipt time.',
        ], $this->periodWarnings($end));

        return $this->success('supplier_stock_ins', $period, $data, $blocks, $warnings);
    }

    private function inventorySummary(): array
    {
        $row = DB::table('products')->selectRaw(
            'COUNT(*) as total_products, '.
            'COALESCE(SUM(CASE WHEN current_stock > reorder_level THEN 1 ELSE 0 END), 0) as in_stock, '.
            'COALESCE(SUM(CASE WHEN current_stock > 0 AND current_stock <= reorder_level THEN 1 ELSE 0 END), 0) as low_stock, '.
            'COALESCE(SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END), 0) as out_of_stock, '.
            'COALESCE(SUM(current_stock * cost_price), 0) as inventory_cost_value, '.
            'COALESCE(SUM(current_stock * selling_price), 0) as inventory_retail_value'
        )->first();
        $data = [
            'total_products' => (int) $row->total_products,
            'in_stock' => (int) $row->in_stock,
            'low_stock' => (int) $row->low_stock,
            'out_of_stock' => (int) $row->out_of_stock,
            'inventory_cost_value' => round((float) $row->inventory_cost_value, 2),
            'inventory_retail_value' => round((float) $row->inventory_retail_value, 2),
        ];
        $categories = DB::table('products')
            ->selectRaw("COALESCE(category, 'Uncategorized') as category, COUNT(*) as products, COALESCE(SUM(current_stock * cost_price), 0) as cost_value")
            ->groupBy('category')
            ->orderByDesc('cost_value')
            ->limit(20)
            ->get()
            ->map(fn (object $category) => [
                'category' => (string) $category->category,
                'products' => (int) $category->products,
                'cost_value' => round((float) $category->cost_value, 2),
            ])->all();
        $data['categories'] = $categories;
        $block = ['type' => 'kpi_grid', 'items' => [
            ['label' => 'Products', 'value' => $data['total_products']],
            ['label' => 'Low stock', 'value' => $data['low_stock']],
            ['label' => 'Out of stock', 'value' => $data['out_of_stock']],
            ['label' => 'Inventory cost value', 'value' => $this->currency($data['inventory_cost_value'])],
        ]];
        $blocks = [$block];
        if ($categories !== []) {
            $blocks[] = ['type' => 'bar_chart', 'title' => 'Inventory value by category', 'data' => $categories, 'xKey' => 'category', 'series' => [
                ['key' => 'cost_value', 'label' => 'Cost value'],
            ]];
        }

        return $this->success('inventory_summary', 'current', $data, $blocks);
    }

    private function stockAlerts(string $status, int $limit): array
    {
        $query = DB::table('products')->select('product_code', 'product_name', 'current_stock', 'reorder_level');
        $query->when($status === 'out_of_stock', fn (Builder $q) => $q->where('current_stock', '<=', 0));
        $query->when($status === 'low_stock', fn (Builder $q) => $q->where('current_stock', '>', 0)->whereColumn('current_stock', '<=', 'reorder_level'));
        $query->when($status === 'all', fn (Builder $q) => $q->whereColumn('current_stock', '<=', 'reorder_level'));
        $rows = $query->orderBy('current_stock')->orderBy('product_name')->limit($limit)->get()
            ->map(fn (object $row) => [
                'product_code' => $row->product_code,
                'product_name' => $row->product_name,
                'current_stock' => (int) $row->current_stock,
                'reorder_level' => (int) $row->reorder_level,
                'status' => (int) $row->current_stock <= 0 ? 'out_of_stock' : 'low_stock',
            ])->all();
        $data = ['status' => $status, 'alerts' => $rows, 'returned' => count($rows), 'limit' => $limit];
        $block = ['type' => 'table', 'title' => 'Stock alerts', 'columns' => [
            ['key' => 'product_code', 'label' => 'Code'],
            ['key' => 'product_name', 'label' => 'Product'],
            ['key' => 'current_stock', 'label' => 'Current'],
            ['key' => 'reorder_level', 'label' => 'Reorder level'],
            ['key' => 'status', 'label' => 'Status'],
        ], 'rows' => $rows];
        $blocks = [$block];
        if ($rows !== []) {
            $outCount = count(array_filter($rows, fn (array $row) => $row['status'] === 'out_of_stock'));
            $blocks[] = ['type' => 'recommendations', 'items' => [[
                'title' => $outCount > 0 ? 'Prioritize out-of-stock products' : 'Review low-stock products',
                'reason' => $outCount > 0
                    ? "$outCount of the returned products are out of stock."
                    : count($rows).' products are at or below their reorder level.',
                'action' => 'Confirm demand and supplier availability before placing a replenishment order.',
                'severity' => $outCount > 0 ? 'high' : 'attention',
            ]]];
        }

        return $this->success('stock_alerts', "$status:$limit", $data, $blocks);
    }

    private function stockMovementSummary(string $period, string $granularity): array
    {
        [$start, $end] = $this->window($period);
        $logs = DB::table('inventory_logs as il')->whereBetween('il.created_at', [$start, $end]);
        $totals = (clone $logs)->selectRaw(
            'COUNT(*) as movement_logs, '.
            'COUNT(DISTINCT il.product_id) as distinct_products, '.
            "COALESCE(SUM(CASE WHEN il.transaction_type = 'IN' THEN il.quantity ELSE 0 END), 0) as in_units, ".
            "COALESCE(SUM(CASE WHEN il.transaction_type = 'OUT' THEN il.quantity ELSE 0 END), 0) as out_units, ".
            "COALESCE(SUM(CASE WHEN il.transaction_type = 'ADJUST' THEN il.quantity ELSE 0 END), 0) as adjustment_units, ".
            'COALESCE(SUM(CASE WHEN il.previous_stock IS NOT NULL AND il.new_stock IS NOT NULL THEN il.new_stock - il.previous_stock END), 0) as covered_net_stock_change, '.
            'COALESCE(SUM(CASE WHEN il.previous_stock IS NOT NULL AND il.new_stock IS NOT NULL THEN 1 ELSE 0 END), 0) as stock_change_covered_logs'
        )->first();
        $byType = (clone $logs)
            ->selectRaw('il.transaction_type, COUNT(*) as movement_logs, COALESCE(SUM(il.quantity), 0) as quantity')
            ->groupBy('il.transaction_type')
            ->get()
            ->keyBy('transaction_type');
        $movements = collect(['IN', 'OUT', 'ADJUST'])->map(function (string $type) use ($byType): array {
            $row = $byType->get($type);

            return [
                'transaction_type' => $type,
                'movement_logs' => (int) ($row->movement_logs ?? 0),
                'quantity' => (int) ($row->quantity ?? 0),
            ];
        })->all();
        $bucket = $this->bucketExpression($granularity, 'il.created_at');
        $trendRows = (clone $logs)
            ->selectRaw("$bucket as bucket, il.transaction_type, COALESCE(SUM(il.quantity), 0) as quantity")
            ->groupBy('bucket')
            ->groupBy('il.transaction_type')
            ->orderBy('bucket')
            ->limit(1200)
            ->get();
        $points = [];
        foreach ($trendRows as $row) {
            $periodKey = (string) $row->bucket;
            $points[$periodKey] ??= [
                'period' => $periodKey,
                'in_units' => 0,
                'out_units' => 0,
                'adjustment_units' => 0,
            ];
            $key = match ($row->transaction_type) {
                'IN' => 'in_units',
                'OUT' => 'out_units',
                default => 'adjustment_units',
            };
            $points[$periodKey][$key] = (int) $row->quantity;
        }
        $points = array_values($points);
        $movementLogs = (int) $totals->movement_logs;
        $coveredLogs = (int) $totals->stock_change_covered_logs;
        $fullyCovered = $movementLogs > 0 && $coveredLogs === $movementLogs;
        $netStockChange = $fullyCovered ? (int) $totals->covered_net_stock_change : null;
        $data = [
            'period' => $period,
            'granularity' => $granularity,
            'range' => $this->range($start, $end),
            'movement_logs' => $movementLogs,
            'distinct_products' => (int) $totals->distinct_products,
            'in_units' => (int) $totals->in_units,
            'out_units' => (int) $totals->out_units,
            'adjustment_units' => (int) $totals->adjustment_units,
            'total_movement_quantity' => (int) $totals->in_units + (int) $totals->out_units + (int) $totals->adjustment_units,
            'net_stock_change' => $netStockChange,
            'stock_change_coverage_percent' => $movementLogs > 0 ? round(($coveredLogs / $movementLogs) * 100, 2) : 100.0,
            'movements' => $movements,
            'points' => $points,
        ];
        $blocks = [[
            'type' => 'kpi_grid',
            'items' => [
                ['label' => 'Movement logs', 'value' => $movementLogs],
                ['label' => 'Products moved', 'value' => $data['distinct_products']],
                ['label' => 'Movement quantity', 'value' => $data['total_movement_quantity']],
                ['label' => 'Net stock change', 'value' => $netStockChange ?? 'Unavailable'],
            ],
        ]];
        if ($movements !== []) {
            $blocks[] = [
                'type' => 'bar_chart',
                'title' => 'Inventory movement quantity by type',
                'data' => $movements,
                'xKey' => 'transaction_type',
                'series' => [['key' => 'quantity', 'label' => 'Quantity']],
            ];
        }
        if ($points !== []) {
            $blocks[] = [
                'type' => 'line_chart',
                'title' => 'Inventory movement trend',
                'data' => $points,
                'xKey' => 'period',
                'series' => [
                    ['key' => 'in_units', 'label' => 'IN'],
                    ['key' => 'out_units', 'label' => 'OUT'],
                    ['key' => 'adjustment_units', 'label' => 'ADJUST'],
                ],
            ];
        }
        $warnings = array_merge([
            'Movement quantities are magnitudes. Net stock change is shown only when every log in the period has both previous-stock and new-stock values.',
        ], $this->periodWarnings($end));

        return $this->success('stock_movement_summary', "$period:$granularity", $data, $blocks, $warnings);
    }

    private function topMovedProducts(string $period, int $limit): array
    {
        [$start, $end] = $this->window($period);
        $rows = DB::table('inventory_logs as il')
            ->leftJoin('products as p', 'p.id', '=', 'il.product_id')
            ->whereBetween('il.created_at', [$start, $end])
            ->selectRaw("COALESCE(p.product_code, '—') as product_code, COALESCE(p.product_name, 'Unassigned product') as product_name")
            ->selectRaw(
                'COUNT(*) as movement_logs, '.
                'COALESCE(SUM(il.quantity), 0) as total_movement_quantity, '.
                "COALESCE(SUM(CASE WHEN il.transaction_type = 'IN' THEN il.quantity ELSE 0 END), 0) as in_units, ".
                "COALESCE(SUM(CASE WHEN il.transaction_type = 'OUT' THEN il.quantity ELSE 0 END), 0) as out_units, ".
                "COALESCE(SUM(CASE WHEN il.transaction_type = 'ADJUST' THEN il.quantity ELSE 0 END), 0) as adjustment_units, ".
                'COALESCE(SUM(CASE WHEN il.previous_stock IS NOT NULL AND il.new_stock IS NOT NULL THEN il.new_stock - il.previous_stock ELSE 0 END), 0) as covered_net_stock_change, '.
                'COALESCE(SUM(CASE WHEN il.previous_stock IS NOT NULL AND il.new_stock IS NOT NULL THEN 1 ELSE 0 END), 0) as stock_change_covered_logs'
            )
            ->groupBy('p.id', 'p.product_code', 'p.product_name')
            ->orderByDesc('total_movement_quantity')
            ->orderBy('product_name')
            ->orderBy('p.id')
            ->limit($limit)
            ->get()
            ->map(function (object $row): array {
                $logs = (int) $row->movement_logs;
                $coveredLogs = (int) $row->stock_change_covered_logs;

                return [
                    'product_code' => (string) $row->product_code,
                    'product_name' => (string) $row->product_name,
                    'movement_logs' => $logs,
                    'total_movement_quantity' => (int) $row->total_movement_quantity,
                    'in_units' => (int) $row->in_units,
                    'out_units' => (int) $row->out_units,
                    'adjustment_units' => (int) $row->adjustment_units,
                    'net_stock_change' => $logs > 0 && $coveredLogs === $logs ? (int) $row->covered_net_stock_change : null,
                    'stock_change_coverage_percent' => $logs > 0 ? round(($coveredLogs / $logs) * 100, 2) : 100.0,
                ];
            })->all();
        $data = ['period' => $period, 'range' => $this->range($start, $end), 'products' => $rows];
        $blocks = [];
        if ($rows !== []) {
            $blocks[] = [
                'type' => 'bar_chart',
                'title' => 'Top products by movement quantity',
                'data' => $rows,
                'xKey' => 'product_name',
                'series' => [['key' => 'total_movement_quantity', 'label' => 'Movement quantity']],
            ];
            $blocks[] = [
                'type' => 'table',
                'title' => 'Product movement totals',
                'columns' => [
                    ['key' => 'product_code', 'label' => 'Code'],
                    ['key' => 'product_name', 'label' => 'Product'],
                    ['key' => 'movement_logs', 'label' => 'Logs'],
                    ['key' => 'in_units', 'label' => 'IN'],
                    ['key' => 'out_units', 'label' => 'OUT'],
                    ['key' => 'adjustment_units', 'label' => 'ADJUST'],
                    ['key' => 'net_stock_change', 'label' => 'Net change'],
                ],
                'rows' => $rows,
            ];
        }
        $warnings = array_merge([
            'Movement quantities are magnitudes. Net stock change uses recorded previous-stock and new-stock values.',
        ], $this->periodWarnings($end));

        return $this->success('top_moved_products', "$period:$limit", $data, $blocks, $warnings);
    }

    private function recentInventoryActivity(string $period, string $transactionType, int $limit): array
    {
        [$start, $end] = $this->window($period);
        $logs = DB::table('inventory_logs as il')
            ->leftJoin('products as p', 'p.id', '=', 'il.product_id')
            ->leftJoin('suppliers as s', 's.id', '=', 'il.supplier_id')
            ->whereBetween('il.created_at', [$start, $end])
            ->when($transactionType !== 'all', fn (Builder $query) => $query->where('il.transaction_type', $transactionType))
            ->select('il.id', 'il.transaction_type', 'il.quantity', 'il.previous_stock', 'il.new_stock', 'il.created_at')
            ->selectRaw("COALESCE(p.product_code, '—') as product_code, COALESCE(p.product_name, 'Unassigned product') as product_name")
            ->selectRaw("CASE WHEN il.transaction_type = 'IN' THEN COALESCE(s.supplier_name, 'Unassigned') ELSE NULL END as supplier_name")
            ->orderByDesc('il.created_at')
            ->orderByDesc('il.id')
            ->limit($limit);
        $rows = $logs->get()->map(fn (object $row): array => [
            'occurred_at' => $row->created_at ? CarbonImmutable::parse($row->created_at)->setTimezone(self::TIMEZONE)->toIso8601String() : null,
            'transaction_type' => (string) $row->transaction_type,
            'product_code' => (string) $row->product_code,
            'product_name' => (string) $row->product_name,
            'quantity' => (int) $row->quantity,
            'previous_stock' => $row->previous_stock === null ? null : (int) $row->previous_stock,
            'new_stock' => $row->new_stock === null ? null : (int) $row->new_stock,
            'supplier_name' => $row->supplier_name === null ? null : (string) $row->supplier_name,
        ])->all();
        $data = [
            'period' => $period,
            'transaction_type' => $transactionType,
            'range' => $this->range($start, $end),
            'returned' => count($rows),
            'logs' => $rows,
        ];
        $block = [
            'type' => 'table',
            'title' => 'Recent inventory activity',
            'columns' => [
                ['key' => 'occurred_at', 'label' => 'Occurred at'],
                ['key' => 'transaction_type', 'label' => 'Type'],
                ['key' => 'product_code', 'label' => 'Code'],
                ['key' => 'product_name', 'label' => 'Product'],
                ['key' => 'quantity', 'label' => 'Quantity'],
                ['key' => 'previous_stock', 'label' => 'Previous'],
                ['key' => 'new_stock', 'label' => 'New'],
                ['key' => 'supplier_name', 'label' => 'Supplier'],
            ],
            'rows' => $rows,
        ];

        return $this->success('recent_inventory_activity', "$period:$transactionType:$limit", $data, [$block], $this->periodWarnings($end));
    }

    private function dataFreshness(): array
    {
        $last = DB::table('sync_log')->whereNotNull('completed_at')->orderByDesc('completed_at')->first();
        $completedAt = $last?->completed_at ? CarbonImmutable::parse($last->completed_at)->setTimezone(self::TIMEZONE)->toIso8601String() : null;
        $warnings = $completedAt === null ? ['No completed data synchronization was found.'] : [];

        $blocks = [[
            'type' => 'freshness',
            'title' => 'Latest data synchronization',
            'completed_at' => $completedAt,
            'timezone' => 'UTC+08:00',
            'status' => $completedAt === null ? 'unavailable' : 'completed',
        ]];

        return $this->success('data_freshness', 'latest', ['last_completed_sync' => $completedAt], $blocks, $warnings, $completedAt ? CarbonImmutable::parse($completedAt) : null);
    }

    private function summaryTotals(string $period): array
    {
        [$start, $end] = $this->window($period);
        $row = $this->completedSales($start, $end)->selectRaw('COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue')->first();

        return ['period' => $period, 'range' => $this->range($start, $end), 'revenue' => round((float) $row->revenue, 2), 'orders' => (int) $row->orders];
    }

    private function completedSales(CarbonImmutable $start, CarbonImmutable $end): Builder
    {
        return DB::table('sales')->whereBetween('sale_date', [$start, $end])->whereRaw('LOWER(status) = ?', ['completed']);
    }

    private function dateWindow(string $startDate, string $endDate): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m-d', $startDate, self::TIMEZONE)->startOfDay();
        $end = CarbonImmutable::createFromFormat('!Y-m-d', $endDate, self::TIMEZONE)->endOfDay();

        return [$start->utc(), $end->utc()];
    }

    private function window(string $period): array
    {
        $now = CarbonImmutable::now(self::TIMEZONE);

        [$start, $end] = match ($period) {
            'today' => [$now->startOfDay(), $now->endOfDay()],
            'last7' => [$now->subDays(6)->startOfDay(), $now->endOfDay()],
            'last30' => [$now->subDays(29)->startOfDay(), $now->endOfDay()],
            'this_month' => [$now->startOfMonth(), $now->endOfDay()],
            'last_month' => [$now->subMonthNoOverflow()->startOfMonth(), $now->subMonthNoOverflow()->endOfMonth()],
            'this_year' => [$now->startOfYear(), $now->endOfDay()],
        };

        return [$start->utc(), $end->utc()];
    }

    private function bucketExpression(string $granularity, string $column = 'sale_date'): string
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            return match ($granularity) {
                'hour' => "to_char($column AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD HH24:00')",
                'day' => "to_char($column AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD')",
                'week' => "to_char(date_trunc('week', $column AT TIME ZONE 'Asia/Manila'), 'IYYY-\"W\"IW')",
                'month' => "to_char($column AT TIME ZONE 'Asia/Manila', 'YYYY-MM')",
            };
        }

        return match ($granularity) {
            'hour' => "strftime('%Y-%m-%d %H:00', $column, '+8 hours')",
            'day' => "strftime('%Y-%m-%d', $column, '+8 hours')",
            'week' => "strftime('%Y-W%W', $column, '+8 hours')",
            'month' => "strftime('%Y-%m', $column, '+8 hours')",
        };
    }

    private function success(string $tool, string $scope, array $data, array $blocks = [], array $warnings = [], ?CarbonImmutable $asOf = null): array
    {
        $asOf ??= $this->sourceAsOf();

        return [
            'status' => 'ok',
            'tool' => $tool,
            'as_of' => $asOf->setTimezone(self::TIMEZONE)->toIso8601String(),
            'citation_id' => $tool.':'.$scope,
            'data' => $data,
            'warnings' => $warnings,
            'blocks' => $blocks,
        ];
    }

    private function failure(string $tool, string $warning): array
    {
        return ['status' => 'unavailable', 'tool' => $tool, 'as_of' => null, 'citation_id' => null, 'data' => [], 'warnings' => [$warning], 'blocks' => []];
    }

    private function range(CarbonImmutable $start, CarbonImmutable $end): array
    {
        return [
            'start' => $start->setTimezone(self::TIMEZONE)->toIso8601String(),
            'end' => $end->setTimezone(self::TIMEZONE)->toIso8601String(),
        ];
    }

    private function percentChange(float|int $current, float|int $previous): ?float
    {
        return (float) $previous === 0.0 ? null : round((($current - $previous) / $previous) * 100, 2);
    }

    private function latestCompletedSync(): ?CarbonImmutable
    {
        $completedAt = DB::table('sync_log')->whereNotNull('completed_at')->orderByDesc('completed_at')->value('completed_at');

        return $completedAt ? CarbonImmutable::parse($completedAt)->setTimezone(self::TIMEZONE) : null;
    }

    private function periodWarnings(CarbonImmutable $end): array
    {
        $lastSync = $this->latestCompletedSync();
        if ($lastSync === null) {
            return ['No completed data synchronization was found, so this report may be incomplete.'];
        }

        $endDate = $end->setTimezone(self::TIMEZONE)->toDateString();
        if ($endDate <= $lastSync->toDateString()) {
            return [];
        }

        return ['Last synced '.$lastSync->format('Y-m-d H:i T').'. Changes after '.$lastSync->toDateString().' may be missing.'];
    }

    private function sourceAsOf(): CarbonImmutable
    {
        if ($this->sourceAsOf !== null) {
            return $this->sourceAsOf;
        }

        return $this->sourceAsOf = $this->latestCompletedSync() ?? CarbonImmutable::now(self::TIMEZONE);
    }

    private function currency(float|int $value): string
    {
        return '₱'.number_format((float) $value, 2);
    }

    private function definition(string $name, string $description, array $properties, array $required): array
    {
        return ['type' => 'function', 'function' => [
            'name' => $name,
            'description' => $description,
            'parameters' => ['type' => 'object', 'properties' => (object) $properties, 'required' => $required, 'additionalProperties' => false],
        ]];
    }
}
