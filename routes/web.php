<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
Route::get('/', function () {
    return redirect(Auth::check() ? '/dashboard' : '/login');
});

Route::get('/ui-preview', fn () => Inertia::render('Dashboard'))->name('ui-preview.temp');

Route::middleware('auth')->group(function (){
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/sales', fn () => Inertia::render('Sales'))->name('sales');
    Route::get('/products', fn () => redirect()->route('inventory'))->name('products');
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory');
    Route::get('/inventory-logs', fn () => Inertia::render('InventoryLogs'))->name('inventory-logs');
    Route::get('/suppliers', fn () => Inertia::render('Suppliers'))->name('suppliers');
    Route::get('/staff', fn () => Inertia::render('Staff'))->name('staff');
    Route::get('/assistant', fn () => Inertia::render('Assistant'))->name('assistant');
    Route::get('/settings', fn () => Inertia::render('Settings'))->name('settings');
});

require __DIR__.'/auth.php';
