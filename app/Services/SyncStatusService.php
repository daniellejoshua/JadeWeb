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

        $minutes = max(0, (int) Carbon::parse($last->completed_at)->diffInMinutes());
        $ago = $minutes === 0 ? 'just now'
            : ($minutes === 1 ? '1 minute ago'
                : ($minutes < 60 ? "{$minutes} minutes ago"
                    : (($hours = floor($minutes / 60)) == 1 ? '1 hour ago' : "{$hours} hours ago")));

        return [
            'label' => "Synced {$ago}",
            'detail' => 'Last sync: ' . Carbon::parse($last->completed_at)->format('M j, Y g:i A')
                . ' · ' . (int) ($last->rows_synced ?? 0) . ' rows',
        ];
    }
}