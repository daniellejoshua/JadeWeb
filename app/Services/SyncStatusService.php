<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class SyncStatusService
{
    public function get(): array
    {
        if ($cached = Cache::get('sync.status')) {
            return $cached;
        }

        app()->terminating(fn () => $this->refresh());

        return ['label' => 'Syncing…', 'detail' => 'Refreshing sync status'];
    }

    public function refresh(): void
    {
        try {
            $payload = $this->build(DB::table('sync_log')->orderByDesc('id')->first());
        } catch (Throwable) {
            $payload = ['label' => 'Sync unavailable', 'detail' => 'Could not reach the database'];
        }

        Cache::put('sync.status', $payload, now()->addMinute());
    }

    private function build(object|null $last): array
    {
        if (! $last || ! $last->completed_at) {
            return ['label' => 'Not synced yet', 'detail' => 'No completed sync found'];
        }

        $date = Carbon::parse($last->completed_at);

        return [
            'label' => 'Synced ' . $date->format('M j, g:i A'),
            'detail' => 'Last sync: ' . $date->format('M j, Y g:i A')
                . ' · ' . (int) ($last->rows_synced ?? 0) . ' rows',
        ];
    }
}
