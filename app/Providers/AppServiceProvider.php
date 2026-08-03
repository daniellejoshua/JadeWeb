<?php

namespace App\Providers;

use App\Auth\SupabaseGuard;
use Illuminate\Contracts\Session\Session; // the session store contract
use App\Services\SupabaseAuth;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Foundation\Application;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        Auth::extend('supabase',function( Application $app){
            return new SupabaseGuard(
            $app->make(SupabaseAuth::class),
            $app->make(Session::class),
            );
        });
    }
}
