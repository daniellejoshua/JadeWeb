<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect(Auth::check() ? '/dashboard' : '/login');
});

Route::middleware('auth')->group(function (){
    Route::get('/dashboard', fn ()=> Inertia::render('Dashboard'))->name('dashboard');
});

require __DIR__.'/auth.php';
