<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SupplierDetailTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('suppliers', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('supplier_code')->nullable();
            $table->string('supplier_name')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->boolean('is_active')->nullable();
        });

        Schema::create('products', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('product_name');
        });

        Schema::create('inventory_logs', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->unsignedInteger('product_id');
            $table->string('transaction_type');
            $table->integer('quantity');
            $table->string('reference')->nullable();
            $table->dateTime('created_at')->nullable();
        });

        DB::table('suppliers')->insert([
            'id' => 1,
            'supplier_code' => 'SUP-001',
            'supplier_name' => 'Jade Medical Supply',
            'contact_person' => 'Ana Cruz',
            'phone' => '09170000001',
            'email' => 'ana@example.com',
            'is_active' => true,
        ]);
        DB::table('products')->insert(['id' => 1, 'product_name' => 'Test Product']);

        foreach (range(1, 10) as $id) {
            DB::table('inventory_logs')->insert([
                'id' => $id,
                'supplier_id' => 1,
                'product_id' => 1,
                'transaction_type' => 'IN',
                'quantity' => $id,
                'reference' => $id <= 3 ? 'PO-ALPHA-'.$id : 'PO-BETA-'.$id,
                'created_at' => $id === 10 ? '2026-09-21 09:00:00' : '2026-09-20 09:00:00',
            ]);
        }
    }

    public function test_supplier_history_is_paginated(): void
    {
        $this->asAdmin()
            ->getJson('/suppliers/1')
            ->assertOk()
            ->assertJsonCount(8, 'stockIns')
            ->assertJsonPath('stockInMeta.total', 10)
            ->assertJsonPath('stockInMeta.lastPage', 2)
            ->assertJsonPath('supplier.stock_in_count', 10);
    }

    public function test_supplier_history_can_be_filtered_by_date_and_reference(): void
    {
        $this->asAdmin()
            ->getJson('/suppliers/1?date=2026-09-20&reference=ALPHA')
            ->assertOk()
            ->assertJsonCount(3, 'stockIns')
            ->assertJsonPath('stockInMeta.total', 3)
            ->assertJsonPath('stockInFilters.date', '2026-09-20')
            ->assertJsonPath('stockInFilters.reference', 'ALPHA');
    }

    private function asAdmin(): static
    {
        return $this->withSession([
            'supabase_auth' => [
                'user' => [
                    'id' => 'auth-user-id',
                    'email' => 'admin@example.com',
                    'user_metadata' => ['full_name' => 'Admin', 'role' => 'Admin'],
                ],
                'access_token' => 'test-access-token',
                'refresh_token' => 'test-refresh-token',
                'expires_at' => now()->addHour()->timestamp,
            ],
        ]);
    }
}
