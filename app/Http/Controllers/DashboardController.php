<?php

namespace App\Http\Controllers;

use App\Services\DashboardMetrics;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
   public function index(DashboardMetrics $metrics){
       return Inertia::render('Dashboard', [
            'periods' => $metrics->periods(),
            'topProducts' => $metrics->topProducts(),
            'inventoryStatus' => $metrics->inventoryStatus(),
            'inventoryValue' => $metrics->inventoryValue(),
            'productCount' => $metrics->productCount(),
        ]);

   }
}
