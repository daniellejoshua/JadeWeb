<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect(Auth::check() ? '/dashboard' : '/login');
});

Route::get('/ui-preview', fn () => Inertia::render('Dashboard'))->name('ui-preview.temp');

Route::get('/ui-preview', fn () => Inertia::render('Dashboard'))->name('ui-preview.temp');

Route::get('/ui-preview', fn () => Inertia::render('Dashboard'))->name('ui-preview.temp');

Route::middleware('auth')->group(function (){
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');
    Route::get('/sales', fn () => Inertia::render('Sales'))->name('sales');
    Route::get('/products', fn () => Inertia::render('Products'))->name('products');
    Route::get('/inventory', fn () => Inertia::render('Inventory'))->name('inventory');
    Route::get('/suppliers', fn () => Inertia::render('Suppliers'))->name('suppliers');
    Route::get('/staff', fn () => Inertia::render('Staff'))->name('staff');
    Route::get('/assistant', fn () => Inertia::render('Assistant'))->name('assistant');
    Route::get('/settings', fn () => Inertia::render('Settings'))->name('settings');
});

require __DIR__.'/auth.php';
