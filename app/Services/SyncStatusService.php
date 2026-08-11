<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SyncStatusService
{
    public function get(): array
    {
        $last = DB::table('sync_log')->orderByDesc('id')->first();

        if (! $last || ! $last->completed_at) {
            return ['label' => 'Not synced yet', 'detail' => 'No completed sync found'];
        }

        $date = Carbon::parse($last->completed_at);

        return [
            'label' => 'Synced ' . $date->format('M j, Y'),
            'detail' => 'Last sync: ' . $date->format('M j, Y g:i A')
                . ' · ' . (int) ($last->rows_synced ?? 0) . ' rows',
        ];
    }
}