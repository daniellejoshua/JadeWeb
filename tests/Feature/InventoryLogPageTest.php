<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InventoryLogPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-09-25 12:00:00');

        Schema::create('products', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('product_name');
            $table->string('category')->nullable();
        });

        Schema::create('suppliers', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('supplier_name');
        });

        Schema::create('inventory_logs', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('product_id')->nullable();
            $table->unsignedInteger('supplier_id')->nullable();
            $table->string('transaction_type');
            $table->integer('quantity');
            $table->integer('previous_stock')->nullable();
            $table->integer('new_stock')->nullable();
            $table->string('batch_number')->nullable();
            $table->string('expiry_date')->nullable();
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->dateTime('created_at');
        });

        DB::table('products')->insert([
            ['id' => 1, 'product_name' => 'Today Serum', 'category' => 'Skin Care'],
            ['id' => 2, 'product_name' => 'Archive Cleanser', 'category' => 'Cleansers'],
            ['id' => 3, 'product_name' => 'Adjusted Cream', 'category' => null],
        ]);
        DB::table('suppliers')->insert(['id' => 1, 'supplier_name' => 'Clinic Supply Co.']);
        DB::table('inventory_logs')->insert([
            [
                'id' => 10,
                'product_id' => 1,
                'supplier_id' => 1,
                'transaction_type' => 'IN',
                'quantity' => 5,
                'previous_stock' => 3,
                'new_stock' => 8,
                'batch_number' => 'B-10',
                'expiry_date' => '2027-05-10',
                'reference' => 'PO-TODAY',
                'notes' => 'Received today',
                'created_at' => '2026-09-25 09:00:00',
            ],
            [
                'id' => 20,
                'product_id' => 2,
                'supplier_id' => null,
                'transaction_type' => 'OUT',
                'quantity' => 2,
                'previous_stock' => 8,
                'new_stock' => 6,
                'batch_number' => null,
                'expiry_date' => null,
                'reference' => '=ARCHIVE-REF',
                'notes' => 'Older issue',
                'created_at' => '2026-09-24 14:00:00',
            ],
            [
                'id' => 30,
                'product_id' => 3,
                'supplier_id' => null,
                'transaction_type' => 'ADJUST',
                'quantity' => 1,
                'previous_stock' => 4,
                'new_stock' => 5,
                'batch_number' => null,
                'expiry_date' => null,
                'reference' => 'COUNT-30',
                'notes' => null,
                'created_at' => '2026-09-23 08:00:00',
            ],
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/inventory-logs')->assertRedirect('/login');
    }

    public function test_the_page_defaults_to_todays_logs(): void
    {
        $this->asRole('Staff')
            ->get('/inventory-logs')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('InventoryLogs')
                ->where('filters.date', '2026-09-25')
                ->where('filters.dateEnabled', true)
                ->where('filters.type', 'all')
                ->has('logs', 1)
                ->where('logs.0.id', 10)
                ->where('logs.0.supplier_name', 'Clinic Supply Co.')
                ->where('meta.total', 1));
    }

    public function test_search_ignores_date_but_still_combines_with_type(): void
    {
        $this->asRole('Manager')
            ->get('/inventory-logs?search=Archive')
            ->assertInertia(fn (Assert $page) => $page
                ->has('logs', 1)
                ->where('logs.0.id', 20));

        $this->asRole('Manager')
            ->get('/inventory-logs?search=Archive&type=IN')
            ->assertInertia(fn (Assert $page) => $page
                ->has('logs', 0)
                ->where('meta.total', 0));
    }

    public function test_unchecking_date_shows_all_types_including_adjustments(): void
    {
        $this->asRole('Admin')
            ->get('/inventory-logs?date_enabled=0')
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.dateEnabled', false)
                ->has('logs', 3)
                ->where('logs.2.transaction_type', 'ADJUST'));
    }

    public function test_numeric_search_matches_the_log_id(): void
    {
        $this->asRole('Admin')
            ->get('/inventory-logs?search=30')
            ->assertInertia(fn (Assert $page) => $page
                ->has('logs', 1)
                ->where('logs.0.product_name', 'Adjusted Cream'));
    }

    public function test_export_uses_the_same_filters_and_escapes_formula_cells(): void
    {
        $response = $this->asRole('Staff')->get('/inventory-logs/export?search=Archive&type=OUT');

        $response->assertOk()->assertDownload();
        $csv = $response->streamedContent();

        $this->assertStringContainsString('Archive Cleanser', $csv);
        $this->assertStringContainsString("'=ARCHIVE-REF", $csv);
        $this->assertStringNotContainsString('Today Serum', $csv);
    }

    private function asRole(string $role): static
    {
        return $this->withSession([
            'supabase_auth' => [
                'user' => [
                    'id' => 'auth-user-id',
                    'email' => strtolower($role).'@example.com',
                    'user_metadata' => ['full_name' => 'Test User', 'role' => $role],
                ],
                'access_token' => 'test-access-token',
                'refresh_token' => 'test-refresh-token',
                'expires_at' => time() + 3600,
            ],
        ]);
    }
}
