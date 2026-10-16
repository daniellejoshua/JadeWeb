<?php

namespace Tests\Feature;

use App\Services\Assistant\AnalyticsTools;
use Carbon\CarbonImmutable;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AssistantTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-25 12:00:00', 'Asia/Manila'));
        config()->set('services.groq.key', 'test-groq-key');

        Schema::create('users', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('employee_code')->nullable();
            $table->string('full_name');
            $table->string('user_role')->nullable();
            $table->boolean('is_active')->nullable();
        });
        Schema::create('suppliers', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('supplier_code');
            $table->string('supplier_name');
            $table->boolean('is_active')->nullable();
        });
        Schema::create('sales', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('user_id')->nullable();
            $table->dateTime('sale_date');
            $table->decimal('total_amount', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->string('status');
        });
        Schema::create('products', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('supplier_id')->nullable();
            $table->string('product_code');
            $table->string('product_name');
            $table->string('category')->nullable();
            $table->string('unit')->nullable();
            $table->integer('current_stock');
            $table->integer('reorder_level');
            $table->decimal('cost_price', 12, 2);
            $table->decimal('selling_price', 12, 2);
            $table->boolean('is_active')->default(true);
        });
        Schema::create('sale_items', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('sale_id');
            $table->unsignedInteger('product_id');
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
        });
        Schema::create('inventory_logs', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('product_id')->nullable();
            $table->string('transaction_type');
            $table->integer('quantity');
            $table->integer('previous_stock')->nullable();
            $table->integer('new_stock')->nullable();
            $table->unsignedInteger('supplier_id')->nullable();
            $table->dateTime('created_at');
        });
        Schema::create('sync_log', function (Blueprint $table): void {
            $table->increments('id');
            $table->dateTime('completed_at')->nullable();
        });

        DB::table('users')->insert([
            ['id' => 1, 'employee_code' => 'EMP-1', 'full_name' => 'Admin One', 'user_role' => 'Admin', 'is_active' => true],
            ['id' => 2, 'employee_code' => 'EMP-2', 'full_name' => 'Admin Two', 'user_role' => 'Admin', 'is_active' => true],
            ['id' => 3, 'employee_code' => 'EMP-3', 'full_name' => 'Manager Three', 'user_role' => 'Manager', 'is_active' => true],
            ['id' => 4, 'employee_code' => 'EMP-4', 'full_name' => 'Staff Four', 'user_role' => 'Staff', 'is_active' => true],
            ['id' => 5, 'employee_code' => 'EMP-5', 'full_name' => 'Staff Five', 'user_role' => 'Staff', 'is_active' => true],
            ['id' => 6, 'employee_code' => 'EMP-6', 'full_name' => 'Staff Six', 'user_role' => 'Staff', 'is_active' => true],
            ['id' => 7, 'employee_code' => 'EMP-7', 'full_name' => 'Staff Seven', 'user_role' => 'Staff', 'is_active' => false],
        ]);
        DB::table('suppliers')->insert([
            ['id' => 1, 'supplier_code' => 'SUP-1', 'supplier_name' => 'Alpha Supply', 'is_active' => true],
            ['id' => 2, 'supplier_code' => 'SUP-2', 'supplier_name' => 'Beta Supply', 'is_active' => false],
        ]);
        DB::table('products')->insert([
            ['id' => 1, 'supplier_id' => 1, 'product_code' => 'A-1', 'product_name' => 'Alpha', 'current_stock' => 2, 'reorder_level' => 5, 'cost_price' => 20, 'selling_price' => 50],
            ['id' => 2, 'supplier_id' => 1, 'product_code' => 'B-1', 'product_name' => 'Beta', 'current_stock' => 0, 'reorder_level' => 3, 'cost_price' => 10, 'selling_price' => 20],
            ['id' => 3, 'supplier_id' => 2, 'product_code' => 'C-1', 'product_name' => 'Gamma', 'current_stock' => 10, 'reorder_level' => 2, 'cost_price' => 5, 'selling_price' => 10],
        ]);
        DB::table('sales')->insert([
            ['id' => 1, 'user_id' => 4, 'sale_date' => '2026-09-25 01:00:00', 'total_amount' => 100, 'discount_amount' => 5, 'payment_method' => 'Cash', 'status' => 'Completed'],
            ['id' => 2, 'user_id' => 5, 'sale_date' => '2026-09-25 02:00:00', 'total_amount' => 60, 'discount_amount' => 0, 'payment_method' => 'Card', 'status' => 'COMPLETED'],
            ['id' => 3, 'user_id' => 4, 'sale_date' => '2026-09-25 03:00:00', 'total_amount' => 999, 'discount_amount' => 0, 'payment_method' => 'Cash', 'status' => 'Aborted'],
            ['id' => 4, 'user_id' => 5, 'sale_date' => '2026-09-25 04:00:00', 'total_amount' => 500, 'discount_amount' => 0, 'payment_method' => 'Cash', 'status' => 'Pending'],
            ['id' => 5, 'user_id' => 6, 'sale_date' => '2026-08-25 02:00:00', 'total_amount' => 200, 'discount_amount' => 0, 'payment_method' => 'GCash', 'status' => 'Completed'],
            ['id' => 6, 'user_id' => 5, 'sale_date' => '2026-08-26 02:00:00', 'total_amount' => 40, 'discount_amount' => 0, 'payment_method' => 'Cash', 'status' => 'Completed'],
        ]);
        DB::table('sale_items')->insert([
            ['sale_id' => 1, 'product_id' => 1, 'quantity' => 2, 'unit_price' => 50],
            ['sale_id' => 2, 'product_id' => 2, 'quantity' => 3, 'unit_price' => 20],
            ['sale_id' => 3, 'product_id' => 1, 'quantity' => 10, 'unit_price' => 99.90],
        ]);
        DB::table('inventory_logs')->insert([
            ['id' => 1, 'product_id' => 1, 'transaction_type' => 'IN', 'quantity' => 10, 'previous_stock' => 2, 'new_stock' => 12, 'supplier_id' => 1, 'created_at' => '2026-09-25 01:00:00'],
            ['id' => 2, 'product_id' => 1, 'transaction_type' => 'OUT', 'quantity' => 3, 'previous_stock' => 12, 'new_stock' => 9, 'supplier_id' => 1, 'created_at' => '2026-09-25 02:00:00'],
            ['id' => 3, 'product_id' => 1, 'transaction_type' => 'ADJUST', 'quantity' => 2, 'previous_stock' => 9, 'new_stock' => 7, 'supplier_id' => null, 'created_at' => '2026-09-25 03:00:00'],
            ['id' => 4, 'product_id' => 2, 'transaction_type' => 'OUT', 'quantity' => 1, 'previous_stock' => 1, 'new_stock' => 0, 'supplier_id' => 1, 'created_at' => '2026-09-25 04:00:00'],
            ['id' => 5, 'product_id' => 3, 'transaction_type' => 'IN', 'quantity' => 5, 'previous_stock' => 10, 'new_stock' => 15, 'supplier_id' => 2, 'created_at' => '2026-08-25 02:00:00'],
        ]);
        DB::table('sync_log')->insert(['completed_at' => '2026-09-18 03:30:00']);
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_sales_tools_calculate_only_completed_sales(): void
    {
        $tools = app(AnalyticsTools::class);

        $summary = $tools->execute('sales_summary', ['period' => 'today']);
        $top = $tools->execute('top_products', ['period' => 'today', 'limit' => 5]);

        $this->assertSame('ok', $summary['status']);
        $this->assertSame(160.0, $summary['data']['revenue']);
        $this->assertSame(2, $summary['data']['orders']);
        $this->assertSame(5, $summary['data']['units_sold']);
        $this->assertSame(5.0, $summary['data']['discounts']);
        $this->assertSame(90.0, $summary['data']['estimated_gross_profit']);
        $this->assertCount(2, $summary['data']['payment_breakdown']);
        $this->assertStringContainsString('current cost price', $summary['warnings'][0]);
        $this->assertCount(2, $top['data']['products']);
        $this->assertSame('Alpha', $top['data']['products'][0]['product_name']);
    }

    public function test_payment_breakdown_supports_custom_dates_and_returns_a_pie_chart(): void
    {
        $tools = app(AnalyticsTools::class);

        $result = $tools->execute('payment_breakdown', [
            'start_date' => '2026-08-25',
            'end_date' => '2026-09-25',
        ]);
        $invalidRange = $tools->execute('payment_breakdown', [
            'start_date' => '2026-09-25',
            'end_date' => '2026-08-25',
        ]);

        $this->assertSame('ok', $result['status']);
        $this->assertSame(400.0, $result['data']['revenue']);
        $this->assertSame(4, $result['data']['orders']);
        $this->assertSame('orders', $result['data']['metric']);
        $this->assertSame('Cash', $result['data']['payments'][0]['method']);
        $this->assertSame(50.0, $result['data']['payments'][0]['order_share_percent']);
        $this->assertSame(35.0, $result['data']['payments'][0]['revenue_share_percent']);
        $this->assertSame('table', $result['blocks'][1]['type']);
        $this->assertSame('pie_chart', $result['blocks'][2]['type']);
        $this->assertSame('orders', $result['blocks'][2]['series'][0]['key']);
        $this->assertStringContainsString('order share', $result['blocks'][1]['title']);
        $this->assertStringContainsString('2026-08-25 to 2026-09-25', $result['blocks'][1]['title']);
        $this->assertStringContainsString('may be missing', $result['warnings'][0]);
        $this->assertSame('unavailable', $invalidRange['status']);
        $this->assertStringContainsString('Invalid tool arguments', $invalidRange['warnings'][0]);
    }

    public function test_inventory_tools_return_bounded_aggregates_and_alerts(): void
    {
        $tools = app(AnalyticsTools::class);
        $definition = collect($tools->definitions())->firstWhere('function.name', 'inventory_summary');

        $summary = $tools->execute('inventory_summary', []);
        $alerts = $tools->execute('stock_alerts', ['status' => 'all', 'limit' => 1]);

        $this->assertSame([
            'total_products' => 3,
            'in_stock' => 1,
            'low_stock' => 1,
            'out_of_stock' => 1,
            'inventory_cost_value' => 90.0,
            'inventory_retail_value' => 200.0,
            'categories' => [[
                'category' => 'Uncategorized',
                'products' => 3,
                'cost_value' => 90.0,
            ]],
        ], $summary['data']);
        $this->assertIsObject($definition['function']['parameters']['properties']);
        $this->assertCount(1, $alerts['data']['alerts']);
        $this->assertSame('out_of_stock', $alerts['data']['alerts'][0]['status']);
        $this->assertSame('table', $alerts['blocks'][0]['type']);
    }

    public function test_staff_and_supplier_tools_return_privacy_safe_aggregates(): void
    {
        DB::table('sales')->insert([
            ['id' => 7, 'user_id' => 6, 'sale_date' => '2026-09-25 05:00:00', 'total_amount' => 50, 'payment_method' => 'Cash', 'status' => 'Completed'],
            ['id' => 8, 'user_id' => 3, 'sale_date' => '2026-09-25 06:00:00', 'total_amount' => 40, 'payment_method' => 'Card', 'status' => 'Completed'],
        ]);
        $tools = app(AnalyticsTools::class);

        $staffSummary = $tools->execute('staff_summary', []);
        $staffSales = $tools->execute('staff_sales_by_role', ['period' => 'today']);
        $supplierSummary = $tools->execute('supplier_summary', []);
        $supplierStockIns = $tools->execute('supplier_stock_ins', ['period' => 'today']);

        $this->assertSame('ok', $staffSummary['status']);
        $this->assertSame(7, $staffSummary['data']['total_staff']);
        $this->assertSame(6, $staffSummary['data']['active']);
        $this->assertSame(1, $staffSummary['data']['inactive']);
        $this->assertSame('Staff', $staffSummary['data']['roles'][0]['role']);
        $this->assertSame(4, $staffSummary['data']['roles'][0]['staff']);
        $this->assertSame('bar_chart', $staffSummary['blocks'][1]['type']);
        $this->assertSame(4, $staffSales['data']['orders']);
        $this->assertSame(250.0, $staffSales['data']['revenue']);
        $this->assertSame(4, $staffSales['data']['active_sellers']);
        $this->assertSame(1, $staffSales['data']['withheld_role_count']);
        $this->assertCount(1, $staffSales['data']['role_cohorts']);
        $this->assertSame('Staff', $staffSales['data']['role_cohorts'][0]['role']);
        $this->assertSame(3, $staffSales['data']['role_cohorts'][0]['orders']);
        $this->assertSame(210.0, $staffSales['data']['role_cohorts'][0]['revenue']);
        $this->assertStringContainsString('current roster role', $staffSales['warnings'][0]);
        $this->assertSame(2, $supplierSummary['data']['total_suppliers']);
        $this->assertSame(1, $supplierSummary['data']['active']);
        $this->assertSame(1, $supplierSummary['data']['inactive']);
        $this->assertSame(3, $supplierSummary['data']['assigned_products']);
        $this->assertSame(0, $supplierSummary['data']['unassigned_products']);
        $this->assertSame('Alpha Supply', $supplierSummary['data']['suppliers'][0]['supplier_name']);
        $this->assertSame(1, $supplierStockIns['data']['stock_ins']);
        $this->assertSame(10, $supplierStockIns['data']['units_received']);
        $this->assertSame(200.0, $supplierStockIns['data']['estimated_value']);
        $this->assertStringContainsString('current cost price', $supplierStockIns['warnings'][0]);
    }

    public function test_staff_sales_ranking_supports_all_metrics_without_putting_identity_in_model_data(): void
    {
        $tools = app(AnalyticsTools::class);

        $allMetrics = $tools->execute('staff_sales_ranking', [
            'period' => 'today',
            'metric' => 'all',
            'limit' => 5,
        ]);
        $revenue = $tools->execute('staff_sales_ranking', [
            'period' => 'today',
            'metric' => 'revenue',
            'limit' => 1,
        ]);
        $invalid = $tools->execute('staff_sales_ranking', [
            'period' => 'today',
            'metric' => 'profit',
            'limit' => 5,
        ]);

        $this->assertSame('ok', $allMetrics['status']);
        $this->assertSame(2, $allMetrics['data']['eligible_staff']);
        $this->assertSame(2, $allMetrics['data']['returned']);
        $this->assertStringContainsString('Equal-weight normalized score', $allMetrics['data']['scoring_method']);
        $this->assertStringNotContainsString('Staff Four', json_encode($allMetrics['data'], JSON_THROW_ON_ERROR));
        $this->assertStringNotContainsString('EMP-4', json_encode($allMetrics['data'], JSON_THROW_ON_ERROR));
        $this->assertSame('Staff Four', $allMetrics['blocks'][0]['rows'][0]['full_name']);
        $this->assertSame('EMP-4', $allMetrics['blocks'][0]['rows'][0]['employee_code']);
        $this->assertSame(100.0, $allMetrics['blocks'][0]['rows'][0]['performance_score']);
        $this->assertSame(73.33, $allMetrics['blocks'][0]['rows'][1]['performance_score']);
        $this->assertSame(['table', 'bar_chart'], array_column($allMetrics['blocks'], 'type'));
        $this->assertSame('Staff Four', $revenue['blocks'][0]['rows'][0]['full_name']);
        $this->assertSame('unavailable', $invalid['status']);
    }

    public function test_best_staff_question_returns_renderer_only_identity_and_cited_ranking(): void
    {
        Http::fakeSequence()
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'tool_calls' => [[
                    'id' => 'call_staff_ranking',
                    'type' => 'function',
                    'function' => ['name' => 'staff_sales_ranking', 'arguments' => '{"period":"this_month","metric":"all","limit":10}'],
                ]],
            ]]]])
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'content' => 'The verified table ranks staff across all three sales metrics [staff_sales_ranking:this_month:all:10].',
            ]]]]);

        $this->authenticated()->postJson(route('assistant.message'), [
            'message' => 'Who is the best staff based on sales this month?',
        ])
            ->assertOk()
            ->assertJsonPath('citations.0.id', 'staff_sales_ranking:this_month:all:10')
            ->assertJsonPath('blocks.0.type', 'table')
            ->assertJsonPath('blocks.0.rows.0.full_name', 'Staff Four')
            ->assertJsonPath('blocks.1.type', 'bar_chart');

        Http::assertSent(function (Request $request): bool {
            return collect($request->data()['messages'])->contains(function (array $entry): bool {
                if ($entry['role'] !== 'tool') {
                    return false;
                }

                return str_contains($entry['content'], '"metric":"all"')
                    && ! str_contains($entry['content'], 'Staff Four')
                    && ! str_contains($entry['content'], 'EMP-4')
                    && ! str_contains($entry['content'], '"blocks"');
            });
        });
    }

    public function test_inventory_log_tools_calculate_magnitudes_bounds_and_bounded_recent_activity(): void
    {
        $tools = app(AnalyticsTools::class);

        $summary = $tools->execute('stock_movement_summary', ['period' => 'today', 'granularity' => 'day']);
        $top = $tools->execute('top_moved_products', ['period' => 'today', 'limit' => 5]);
        $recent = $tools->execute('recent_inventory_activity', ['period' => 'today', 'transaction_type' => 'all', 'limit' => 2]);
        $invalid = $tools->execute('recent_inventory_activity', ['period' => 'today', 'transaction_type' => 'INVALID', 'limit' => 2]);

        $this->assertSame('ok', $summary['status']);
        $this->assertSame(4, $summary['data']['movement_logs']);
        $this->assertSame(10, $summary['data']['in_units']);
        $this->assertSame(4, $summary['data']['out_units']);
        $this->assertSame(2, $summary['data']['adjustment_units']);
        $this->assertSame(16, $summary['data']['total_movement_quantity']);
        $this->assertSame(4, $summary['data']['net_stock_change']);
        $this->assertSame(100.0, $summary['data']['stock_change_coverage_percent']);
        $this->assertSame('2026-09-25', $summary['data']['points'][0]['period']);
        $this->assertSame(10, $summary['data']['points'][0]['in_units']);
        $this->assertSame(['kpi_grid', 'bar_chart', 'line_chart'], array_column($summary['blocks'], 'type'));
        $this->assertStringContainsString('may be missing', $summary['warnings'][1]);
        $this->assertSame('Alpha', $top['data']['products'][0]['product_name']);
        $this->assertSame(15, $top['data']['products'][0]['total_movement_quantity']);
        $this->assertSame(5, $top['data']['products'][0]['net_stock_change']);
        $this->assertSame('OUT', $recent['data']['logs'][0]['transaction_type']);
        $this->assertSame('Beta', $recent['data']['logs'][0]['product_name']);
        $this->assertSame('2026-09-25T12:00:00+08:00', $recent['data']['logs'][0]['occurred_at']);
        $this->assertNull($recent['data']['logs'][0]['supplier_name']);
        $this->assertArrayNotHasKey('notes', $recent['data']['logs'][0]);
        $this->assertArrayNotHasKey('reference', $recent['data']['logs'][0]);
        $this->assertArrayNotHasKey('user_id', $recent['data']['logs'][0]);
        $this->assertSame('unavailable', $invalid['status']);
    }

    public function test_data_freshness_returns_a_formatted_renderer_block(): void
    {
        $result = app(AnalyticsTools::class)->execute('data_freshness', []);

        $this->assertSame('ok', $result['status']);
        $this->assertSame('2026-09-18T11:30:00+08:00', $result['data']['last_completed_sync']);
        $this->assertSame('freshness', $result['blocks'][0]['type']);
        $this->assertSame('completed', $result['blocks'][0]['status']);
        $this->assertSame('UTC+08:00', $result['blocks'][0]['timezone']);
    }

    public function test_data_freshness_answer_defers_the_timestamp_to_the_verified_card(): void
    {
        Http::fakeSequence()
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'tool_calls' => [[
                    'id' => 'call_freshness',
                    'type' => 'function',
                    'function' => ['name' => 'data_freshness', 'arguments' => '{}'],
                ]],
            ]]]])
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'content' => 'The most recent database synchronization was completed on 2026-09-18 at 11:30:00 [data_freshness:latest].',
            ]]]]);

        $this->authenticated()->postJson(route('assistant.message'), ['message' => 'When was the data last synced?'])
            ->assertOk()
            ->assertJsonPath('answer', "The latest synchronization details are shown below.\n\nSources: [data_freshness:latest]")
            ->assertJsonPath('blocks.0.type', 'freshness')
            ->assertJsonPath('blocks.0.completed_at', '2026-09-18T11:30:00+08:00');
    }

    public function test_authenticated_request_runs_groq_tool_call_sequence(): void
    {
        Http::fakeSequence()
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'content' => null,
                'tool_calls' => [[
                    'id' => 'call_sales',
                    'type' => 'function',
                    'function' => ['name' => 'sales_summary', 'arguments' => '{"period":"today"}'],
                ]],
            ]]]])
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'content' => 'Today revenue is 160.00 [sales_summary:today].',
            ]]]]);

        $this->authenticated()->postJson(route('assistant.message'), ['message' => 'What are today\'s sales?'])
            ->assertOk()
            ->assertJsonPath('answer', 'Today revenue is 160.00 [sales_summary:today].')
            ->assertJsonPath('citations.0.id', 'sales_summary:today')
            ->assertJsonPath('blocks.0.type', 'kpi_grid')
            ->assertJsonPath('warnings.0', 'Estimated gross profit uses each product\'s current cost price, not its historical cost at sale time.');

        Http::assertSentCount(2);
        Http::assertSent(fn (Request $request): bool => $request->url() === rtrim((string) config('services.groq.base_url'), '/').'/chat/completions');
        Http::assertSent(function (Request $request): bool {
            $messages = $request->data()['messages'];

            return collect($messages)->contains(fn (array $entry) => $entry['role'] === 'tool'
                && str_contains($entry['content'], '"revenue":160'));
        });
    }

    public function test_custom_payment_date_range_returns_a_pie_chart(): void
    {
        Http::fakeSequence()
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'tool_calls' => [[
                    'id' => 'call_payments',
                    'type' => 'function',
                    'function' => ['name' => 'payment_breakdown', 'arguments' => '{"start_date":"2026-08-25","end_date":"2026-09-25"}'],
                ]],
            ]]]])
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'content' => 'Cash led payment-method order share for the selected dates [payment_breakdown:2026-08-25:2026-09-25].',
            ]]]]);

        $this->authenticated()->postJson(route('assistant.message'), [
            'message' => 'Create a pie graph for payment types from August 25, 2026 to now.',
        ])
            ->assertOk()
            ->assertJsonPath('citations.0.id', 'payment_breakdown:2026-08-25:2026-09-25')
            ->assertJsonPath('blocks.0.type', 'kpi_grid')
            ->assertJsonPath('blocks.1.type', 'table')
            ->assertJsonPath('blocks.2.type', 'pie_chart')
            ->assertJsonPath('blocks.2.series.0.key', 'orders')
            ->assertJsonPath('warnings.0', 'Last synced 2026-09-18 11:30 PST. Changes from 2026-09-19 through 2026-09-25 may be missing.');

        Http::assertSent(function (Request $request): bool {
            $messages = $request->data()['messages'];

            return collect($messages)->contains(fn (array $entry) => $entry['role'] === 'tool'
                && str_contains($entry['content'], '"orders"')
                && ! str_contains($entry['content'], '"blocks"')
                && ! str_contains($entry['content'], '"warnings"'));
        });
    }

    public function test_supplier_question_runs_aggregate_tool_and_returns_cited_blocks(): void
    {
        Http::fakeSequence()
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'tool_calls' => [[
                    'id' => 'call_suppliers',
                    'type' => 'function',
                    'function' => ['name' => 'supplier_summary', 'arguments' => '{}'],
                ]],
            ]]]])
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'content' => 'Supplier coverage is verified [supplier_summary:current].',
            ]]]]);

        $this->authenticated()->postJson(route('assistant.message'), ['message' => 'Show supplier coverage'])
            ->assertOk()
            ->assertJsonPath('answer', 'Supplier coverage is verified [supplier_summary:current].')
            ->assertJsonPath('citations.0.id', 'supplier_summary:current')
            ->assertJsonPath('blocks.0.type', 'kpi_grid')
            ->assertJsonPath('blocks.1.type', 'bar_chart')
            ->assertJsonPath('suggestions.0', 'Which suppliers received the most units this month?');
    }

    public function test_verified_tools_supply_missing_inline_citations(): void
    {
        Http::fakeSequence()
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'tool_calls' => [[
                    'id' => 'call_sales',
                    'type' => 'function',
                    'function' => ['name' => 'sales_summary', 'arguments' => '{"period":"today"}'],
                ]],
            ]]]])
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'content' => 'Revenue is 160.00.',
            ]]]]);

        $this->authenticated()->postJson(route('assistant.message'), ['message' => 'What are today\'s sales?'])
            ->assertOk()
            ->assertJsonPath('answer', "Revenue is 160.00.\n\nSources: [sales_summary:today]");
    }

    public function test_fullwidth_citations_are_normalized_without_a_duplicate_source_line(): void
    {
        Http::fakeSequence()
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'tool_calls' => [[
                    'id' => 'call_sales',
                    'type' => 'function',
                    'function' => ['name' => 'sales_summary', 'arguments' => '{"period":"today"}'],
                ]],
            ]]]])
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'content' => 'Revenue is 160.00 【sales_summary:today】.',
            ]]]]);

        $this->authenticated()->postJson(route('assistant.message'), ['message' => 'What are today\'s sales?'])
            ->assertOk()
            ->assertJsonPath('answer', 'Revenue is 160.00 [sales_summary:today].');
    }

    public function test_spaced_inline_citations_are_normalized_without_a_duplicate_source_line(): void
    {
        Http::fakeSequence()
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'tool_calls' => [[
                    'id' => 'call_suppliers',
                    'type' => 'function',
                    'function' => ['name' => 'supplier_summary', 'arguments' => '{}'],
                ]],
            ]]]])
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'content' => 'Supplier coverage is verified [ supplier_summary:current ].',
            ]]]]);

        $this->authenticated()->postJson(route('assistant.message'), ['message' => 'Show supplier coverage'])
            ->assertOk()
            ->assertJsonPath('answer', 'Supplier coverage is verified [supplier_summary:current].');
    }

    public function test_unknown_tool_cannot_produce_a_business_answer(): void
    {
        Http::fakeSequence()
            ->push(['choices' => [['message' => [
                'role' => 'assistant',
                'tool_calls' => [[
                    'id' => 'call_unknown',
                    'type' => 'function',
                    'function' => ['name' => 'run_sql', 'arguments' => '{"sql":"select * from sales"}'],
                ]],
            ]]]])
            ->push(['choices' => [['message' => ['role' => 'assistant', 'content' => 'Revenue is one million.']]]]);

        $this->authenticated()->postJson(route('assistant.message'), ['message' => 'What is sales revenue?'])
            ->assertOk()
            ->assertJsonPath('answer', 'I cannot answer that business-data question because no verified analytics result is available.')
            ->assertJsonPath('citations', [])
            ->assertJsonPath('warnings.0', 'Unknown analytics tool requested.');
    }

    public function test_route_requires_authentication(): void
    {
        $this->postJson(route('assistant.message'), ['message' => 'hello'])->assertRedirect('/login');
    }

    public function test_route_rejects_non_manager_roles(): void
    {
        $this->authenticated('Staff')->postJson(route('assistant.message'), ['message' => 'Show staff summary'])
            ->assertForbidden();

        Http::assertNothingSent();
    }

    public function test_request_payload_is_validated(): void
    {
        $this->authenticated()->postJson(route('assistant.message'), [
            'message' => str_repeat('x', 1501),
            'history' => [['role' => 'system', 'content' => 'not allowed']],
        ])->assertUnprocessable()->assertJsonValidationErrors(['message', 'history.0.role']);

        Http::assertNothingSent();
    }

    public function test_provider_failure_returns_contract_shaped_503(): void
    {
        Http::fake(['*' => Http::response(['error' => ['message' => 'down']], 500)]);

        $this->authenticated()->postJson(route('assistant.message'), ['message' => 'Hello'])
            ->assertServiceUnavailable()
            ->assertJsonStructure(['answer', 'blocks', 'citations', 'suggestions', 'asOf', 'warnings'])
            ->assertJsonPath('warnings.0', 'Assistant provider failure: provider.');
    }

    private function authenticated(string $role = 'Admin'): static
    {
        return $this->withSession([
            'supabase_auth' => [
                'user' => ['id' => 'assistant-test-user', 'email' => 'admin@example.com', 'user_metadata' => ['role' => $role]],
                'access_token' => 'test-access-token',
                'refresh_token' => 'test-refresh-token',
                'expires_at' => time() + 3600,
            ],
        ]);
    }
}
