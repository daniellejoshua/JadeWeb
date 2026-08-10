<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
     protected $table = 'users'; // POS staff roster, NOT auth

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function sales():HasMany{
        return $this->hasMany(Sale::class, 'user_id');
    }


}
