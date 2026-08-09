<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncLog extends Model
{
   protected $table = 'sync_log';
    public $timestamps = false; // columns are started_at / completed_at

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

}
