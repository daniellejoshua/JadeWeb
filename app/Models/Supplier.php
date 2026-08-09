<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    protected $table = 'supplier';
    protected $casts = ['is_active' => 'boolean'];

    public function products():HasMany{
        return $this->hasMany(Product::class,'supplier_id');
    }

}
