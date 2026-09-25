<?php

namespace App\Exports;

use Illuminate\Database\Query\Builder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InventoryLogExporter
{
    public function download(Builder $query): StreamedResponse
    {
        return response()->streamDownload(function () use ($query): void {
            $output = fopen('php://output', 'w');

            fputcsv($output, [
                'Log ID',
                'Product',
                'Category',
                'Type',
                'Quantity',
                'Previous Stock',
                'New Stock',
                'Supplier',
                'Reference',
                'Batch Number',
                'Expiry Date',
                'Notes',
                'Created At',
            ], ',', '"', '');

            foreach ($query->cursor() as $log) {
                fputcsv($output, [
                    $log->id,
                    $this->safeCell($log->product_name),
                    $this->safeCell($log->category),
                    $this->safeCell($log->transaction_type),
                    $log->quantity,
                    $log->previous_stock,
                    $log->new_stock,
                    $this->safeCell($log->supplier_name),
                    $this->safeCell($log->reference),
                    $this->safeCell($log->batch_number),
                    $this->safeCell($log->expiry_date),
                    $this->safeCell($log->notes),
                    $this->safeCell($log->created_at),
                ], ',', '"', '');
            }

            fclose($output);
        }, 'jade-inventory-logs-'.now()->format('Y-m-d').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function safeCell(mixed $value): string
    {
        $value = (string) ($value ?? '');

        return preg_match('/^[=+\-@]/', $value) ? "'".$value : $value;
    }
}
