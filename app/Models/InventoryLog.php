<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLog extends Model
{
     protected $table = 'inventory_logs';

    protected $casts = [
        'created_at' => 'datetime',
        'previous_stock' => 'integer',
        'new_stock' => 'integer',
    ];


    public function product():BelongsTo{
        return $this->belongsTo(Product::class,'product_id');
    }


}
