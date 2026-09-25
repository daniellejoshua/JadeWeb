<?php

namespace App\Http\Controllers;

use App\Exports\InventoryLogExporter;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class InventoryLogController extends Controller
{
    private const PER_PAGE = 50;

    public function index(Request $request): Response
    {
        $filters = $this->filtersFrom($request);
        $page = max(1, (int) $request->query('page', 1));

        try {
            $query = $this->filteredQuery($filters);
            $paginator = $query->paginate(self::PER_PAGE, ['*'], 'page', $page)->withQueryString();

            if ($page > $paginator->lastPage()) {
                $paginator = $query->paginate(self::PER_PAGE, ['*'], 'page', $paginator->lastPage())
                    ->withQueryString();
            }

            $logs = collect($paginator->items())->map(fn (object $log) => $this->present($log))->values();
            $meta = [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => max(1, $paginator->lastPage()),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ];
        } catch (Throwable $exception) {
            report($exception);
            $logs = collect();
            $meta = $this->emptyMeta();
        }

        return Inertia::render('InventoryLogs', [
            'logs' => $logs,
            'meta' => $meta,
            'filters' => $filters,
        ]);
    }

    public function export(Request $request, InventoryLogExporter $exporter): StreamedResponse
    {
        return $exporter->download($this->filteredQuery($this->filtersFrom($request)));
    }

    private function filtersFrom(Request $request): array
    {
        $type = strtoupper((string) $request->query('type', 'all'));
        $dateEnabled = $request->query('date_enabled', '1') !== '0';
        $date = trim((string) $request->query('date', now()->toDateString()));

        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $date = now()->toDateString();
        }

        return [
            'search' => trim((string) $request->query('search', '')),
            'type' => in_array($type, ['IN', 'OUT'], true) ? $type : 'all',
            'date' => $date,
            'dateEnabled' => $dateEnabled,
        ];
    }

    private function filteredQuery(array $filters): Builder
    {
        $searchOperator = DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

        return DB::table('inventory_logs as il')
            ->leftJoin('products as p', 'p.id', '=', 'il.product_id')
            ->leftJoin('suppliers as s', 's.id', '=', 'il.supplier_id')
            ->select([
                'il.id',
                'il.transaction_type',
                'il.quantity',
                'il.previous_stock',
                'il.new_stock',
                'il.batch_number',
                'il.expiry_date',
                'il.reference',
                'il.notes',
                'il.created_at',
                'p.product_name',
                'p.category',
                's.supplier_name',
            ])
            ->when($filters['search'] !== '', function (Builder $query) use ($filters, $searchOperator): void {
                $term = $filters['search'];
                $query->where(function (Builder $inner) use ($term, $searchOperator): void {
                    if (ctype_digit($term)) {
                        $inner->orWhere('il.id', (int) $term);
                    }

                    $inner->orWhere('il.reference', $searchOperator, '%'.$term.'%')
                        ->orWhere('p.product_name', $searchOperator, '%'.$term.'%');
                });
            })
            ->when($filters['type'] !== 'all', fn (Builder $query) => $query->where('il.transaction_type', $filters['type']))
            ->when(
                $filters['search'] === '' && $filters['dateEnabled'],
                fn (Builder $query) => $query->whereDate('il.created_at', $filters['date']),
            )
            ->orderByDesc('il.created_at')
            ->orderByDesc('il.id');
    }

    private function present(object $log): array
    {
        return [
            'id' => (int) $log->id,
            'product_name' => (string) ($log->product_name ?? 'Unknown product'),
            'category' => $log->category,
            'transaction_type' => (string) $log->transaction_type,
            'quantity' => (int) $log->quantity,
            'previous_stock' => $log->previous_stock === null ? null : (int) $log->previous_stock,
            'new_stock' => $log->new_stock === null ? null : (int) $log->new_stock,
            'supplier_name' => $log->supplier_name,
            'reference' => $log->reference,
            'batch_number' => $log->batch_number,
            'expiry_date' => $log->expiry_date,
            'notes' => $log->notes,
            'created_at' => $log->created_at,
        ];
    }

    private function emptyMeta(): array
    {
        return [
            'currentPage' => 1,
            'lastPage' => 1,
            'perPage' => self::PER_PAGE,
            'total' => 0,
            'from' => null,
            'to' => null,
        ];
    }
}
