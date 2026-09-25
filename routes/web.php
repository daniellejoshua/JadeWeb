<?php

use App\Http\Controllers\AssistantController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\InventoryLogController;
use App\Http\Controllers\SalesRecordController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\SupplierController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect(Auth::check() ? '/dashboard' : '/login');
});

Route::get('/ui-preview', fn () => Inertia::render('Dashboard'))->name('ui-preview.temp');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/sales', [SalesRecordController::class, 'index'])->name('sales');
    Route::get('/sales/{id}/receipt', [SalesRecordController::class, 'receipt'])->name('sales.receipt');
    Route::get('/products', fn () => redirect()->route('inventory'))->name('products');
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory');
    Route::get('/inventory-logs', [InventoryLogController::class, 'index'])->name('inventory-logs');
    Route::get('/inventory-logs/export', [InventoryLogController::class, 'export'])->name('inventory-logs.export');
    Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers');
    Route::get('/suppliers/{id}', [SupplierController::class, 'detail'])->name('suppliers.detail');
    Route::get('/staff', [StaffController::class, 'index'])->name('staff');
    Route::get('/staff/export', [StaffController::class, 'export'])->name('staff.export');
    Route::get('/staff/{staff}', [StaffController::class, 'show'])->whereNumber('staff')->name('staff.show');
    Route::get('/assistant', fn () => Inertia::render('Assistant'))->name('assistant');
    Route::post('/assistant/message', [AssistantController::class, 'message'])
        ->middleware('throttle:20,1')
        ->name('assistant.message');
    Route::get('/settings', fn () => Inertia::render('Settings'))->name('settings');
});

require __DIR__.'/auth.php';
