<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Throwable;

class InventoryController extends Controller
{
    public function index()
    {
        try {
            $products = DB::table('products')
                ->orderBy('product_name')
                ->get()
                ->map(fn ($p) => [
                    'id' => (int) $p->id,
                    'product_code' => $p->product_code,
                    'product_name' => $p->product_name,
                    'category' => $p->category,
                    'unit' => $p->unit,
                    'current_stock' => (int) $p->current_stock,
                    'reorder_level' => (int) $p->reorder_level,
                    'cost_price' => round((float) $p->cost_price, 2),
                    'selling_price' => round((float) $p->selling_price, 2),
                    'image_url' => $p->image_url,
                    'is_active' => (bool) $p->is_active,
                ])
                ->values();

            $categories = DB::table('products')
                ->whereNotNull('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->values();

            $total = $products->count();
        } catch (Throwable) {
            $products = collect();
            $categories = collect();
            $total = 0;
        }

        return Inertia::render('Inventory', [
            'products' => $products,
            'categories' => $categories,
            'totalProducts' => $total,
        ]);
    }
}