<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop the Breeze auth users table.
     *
     * The synced `users` table (LAN schema) is the real one. Guarded so this
     * only removes the Breeze variant (which has a `password` column); the
     * synced table is left untouched no matter the run order.
     */
    public function up(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'password')) {
            Schema::dropIfExists('users');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
