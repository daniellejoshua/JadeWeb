<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
   
    protected $table = 'sale_items';

    protected $casts = [
        'unit_price' => 'float',
        'original_unit_price' => 'float',
        'line_discount' => 'float',
        'sub_total' => 'float',
    ];

    public function sales():BelongsTo{
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function product():BelongsTo{
     return $this->belongsTo(Product::class,'product_id');
    }
}
