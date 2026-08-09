<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    protected $table = 'sales';
      protected $casts = [
        'sale_date' => 'datetime',
        'total_amount' => 'float',
        'amount_paid' => 'float',
        'discount_amount' => 'float',
        'is_void' => 'boolean',
    ];
    public function items():HasMany{
        return $this->hasMany(SaleItem::class,'sale_id');
    }
    public function cashier():BelongsTo{
        return $this->belongsTo(Staff::class,'user_id');
    }
}
