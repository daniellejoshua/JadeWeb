<?php

namespace Tests\Feature;

use App\Services\DashboardMetrics;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use ReflectionMethod;
use Tests\TestCase;

class DashboardMetricsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-09-25 12:00:00');
        Cache::flush();

        Schema::create('sync_log', function (Blueprint $table): void {
            $table->increments('id');
            $table->dateTime('completed_at')->nullable();
        });
        Schema::create('company_settings', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('company_name')->nullable();
        });
        Schema::create('products', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('product_name');
            $table->string('category')->nullable();
            $table->string('image_url')->nullable();
        });
        Schema::create('sales', function (Blueprint $table): void {
            $table->increments('id');
            $table->dateTime('sale_date');
            $table->string('status');
        });
        Schema::create('sale_items', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('sale_id');
            $table->unsignedInteger('product_id');
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
        });

        DB::table('sync_log')->insert(['id' => 1, 'completed_at' => '2026-09-18 12:00:00']);
        DB::table('company_settings')->insert(['company_name' => 'Test Clinic']);
        DB::table('products')->insert([
            ['id' => 1, 'product_name' => 'Alpha', 'category' => 'A'],
            ['id' => 2, 'product_name' => 'Beta', 'category' => 'B'],
            ['id' => 3, 'product_name' => 'Gamma', 'category' => 'C'],
        ]);
        DB::table('sales')->insert([
            ['id' => 1, 'sale_date' => '2026-09-10 08:00:00', 'status' => 'Completed'],
            ['id' => 2, 'sale_date' => '2026-09-11 08:00:00', 'status' => 'COMPLETED'],
            ['id' => 3, 'sale_date' => '2026-09-12 08:00:00', 'status' => 'Pending'],
            ['id' => 4, 'sale_date' => '2026-09-13 08:00:00', 'status' => 'Aborted'],
            ['id' => 5, 'sale_date' => '2026-08-31 08:00:00', 'status' => 'Completed'],
        ]);
        DB::table('sale_items')->insert([
            ['sale_id' => 1, 'product_id' => 1, 'quantity' => 2, 'unit_price' => 100],
            ['sale_id' => 2, 'product_id' => 2, 'quantity' => 5, 'unit_price' => 20],
            ['sale_id' => 3, 'product_id' => 2, 'quantity' => 100, 'unit_price' => 20],
            ['sale_id' => 4, 'product_id' => 1, 'quantity' => 100, 'unit_price' => 100],
            ['sale_id' => 5, 'product_id' => 3, 'quantity' => 100, 'unit_price' => 100],
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_top_products_use_completed_current_month_sales_only(): void
    {
        $products = app(DashboardMetrics::class)->topProductsUnCached();

        $this->assertCount(2, $products);
        $this->assertSame('Alpha', $products[0]['product_name']);
        $this->assertSame(2, $products[0]['quantity_sold']);
        $this->assertSame(200.0, $products[0]['revenue']);
        $this->assertSame('Beta', $products[1]['product_name']);
        $this->assertSame(100.0, $products[1]['revenue']);
    }

    public function test_top_product_cache_is_snapshot_and_limit_specific(): void
    {
        $metrics = app(DashboardMetrics::class);

        $topOne = $metrics->topProducts(1);
        $topTwo = $metrics->topProducts(2);
        DB::table('sale_items')->where('sale_id', 2)->update(['quantity' => 50]);

        $this->assertCount(1, $topOne);
        $this->assertCount(2, $topTwo);
        $this->assertSame('Alpha', $metrics->topProducts(1)[0]['product_name']);
        $this->assertSame('Beta', $metrics->topProductsUnCached(1)[0]['product_name']);
        $this->assertTrue(Cache::has('dashboard.top_products.1.1'));
        $this->assertTrue(Cache::has('dashboard.top_products.1.2'));
    }

    public function test_kpis_are_not_marked_unsynced_when_part_of_the_period_is_synced(): void
    {
        $method = new ReflectionMethod(DashboardMetrics::class, 'period');
        $method->setAccessible(true);
        $metrics = app(DashboardMetrics::class);
        $now = Carbon::now();
        $lastSync = Carbon::parse('2026-09-18 12:00:00');
        $daily = [
            '2026-09-10' => ['day' => '2026-09-10', 'revenue' => 200.0, 'orders' => 2],
        ];

        $lastSeven = $method->invoke($metrics, 'last7', $daily, [], ['revenue' => [], 'profit' => []], $now, $lastSync, $lastSync);
        $lastThirty = $method->invoke($metrics, 'last30', $daily, [], ['revenue' => [], 'profit' => []], $now, $lastSync, $lastSync);

        $this->assertTrue($lastSeven['fullyUnsynced']);
        $this->assertFalse($lastThirty['fullyUnsynced']);
        $this->assertSame(200.0, $lastThirty['revenue']);
    }
}
