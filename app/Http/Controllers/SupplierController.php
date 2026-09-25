<?php

namespace App\Http\Controllers;

use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SupplierController extends Controller
{
    private const PER_PAGE = 10;

    private const DETAIL_PER_PAGE = 8;

    private const STOCK_IN_TYPES = ['IN', 'INBOUND', 'STOCK IN', 'STOCKIN'];

    public function index(Request $request): Response
    {
        $filters = $this->filtersFrom($request);
        $page = max(1, (int) $request->query('page', 1));

        try {
            $query = $this->baseQuery();
            $this->applyFilters($query, $filters);

            $paginator = $query->paginate(self::PER_PAGE, ['*'], 'page', $page)->withQueryString();

            if ($page > $paginator->lastPage()) {
                $paginator = $query->paginate(self::PER_PAGE, ['*'], 'page', $paginator->lastPage())
                    ->withQueryString();
            }

            $suppliers = collect($paginator->items())
                ->map(fn ($s) => $this->presentRow($s))
                ->values();

            $meta = [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => max(1, $paginator->lastPage()),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ];
        } catch (Throwable) {
            $suppliers = collect();
            $meta = [
                'currentPage' => 1,
                'lastPage' => 1,
                'perPage' => self::PER_PAGE,
                'total' => 0,
                'from' => null,
                'to' => null,
            ];
        }

        return Inertia::render('Suppliers', [
            'suppliers' => $suppliers,
            'meta' => $meta,
            'filters' => $filters,
        ]);
    }

    public function detail(Request $request, int $id): JsonResponse
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'reference' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $date = trim((string) ($filters['date'] ?? ''));
        $reference = trim((string) ($filters['reference'] ?? ''));
        $page = max(1, (int) ($filters['page'] ?? 1));

        try {
            $supplier = DB::table('suppliers')
                ->where('suppliers.id', $id)
                ->select([
                    'suppliers.id',
                    'suppliers.supplier_code',
                    'suppliers.supplier_name',
                    'suppliers.contact_person',
                    'suppliers.phone',
                    'suppliers.email',
                    'suppliers.is_active',
                ])
                ->first();

            if ($supplier === null) {
                return response()->json(['message' => 'Supplier not found.'], 404);
            }

            $referenceOperator = DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';
            $stockInQuery = DB::table('inventory_logs as il')
                ->leftJoin('products as p', 'p.id', '=', 'il.product_id')
                ->where('il.supplier_id', $id)
                ->whereIn('il.transaction_type', self::STOCK_IN_TYPES)
                ->when($date !== '', fn (Builder $query) => $query->whereDate('il.created_at', $date))
                ->when($reference !== '', fn (Builder $query) => $query->where('il.reference', $referenceOperator, '%'.$reference.'%'))
                ->orderByDesc('il.created_at')
                ->orderByDesc('il.id')
                ->select([
                    'il.id',
                    'il.quantity',
                    'il.reference',
                    'il.created_at',
                ])
                ->selectRaw('p.product_name');

            $stockInPaginator = $stockInQuery->paginate(self::DETAIL_PER_PAGE, ['*'], 'page', $page);

            if ($page > $stockInPaginator->lastPage()) {
                $stockInPaginator = $stockInQuery->paginate(
                    self::DETAIL_PER_PAGE,
                    ['*'],
                    'page',
                    $stockInPaginator->lastPage(),
                );
            }

            $stockIns = collect($stockInPaginator->items())
                ->map(fn ($log) => [
                    'id' => (int) $log->id,
                    'product_name' => (string) ($log->product_name ?? ''),
                    'quantity' => (int) $log->quantity,
                    'reference' => (string) ($log->reference ?? ''),
                    'created_at' => $log->created_at,
                ])
                ->values();

            $stockInCount = DB::table('inventory_logs')
                ->where('supplier_id', $id)
                ->whereIn('transaction_type', self::STOCK_IN_TYPES)
                ->count();
        } catch (Throwable) {
            return response()->json(['message' => 'Supplier details could not be loaded.'], 500);
        }

        return response()->json([
            'supplier' => [
                'id' => (int) $supplier->id,
                'supplier_code' => (string) ($supplier->supplier_code ?? ''),
                'supplier_name' => (string) ($supplier->supplier_name ?? ''),
                'contact_person' => (string) ($supplier->contact_person ?? ''),
                'phone' => (string) ($supplier->phone ?? ''),
                'email' => (string) ($supplier->email ?? ''),
                'is_active' => (bool) $supplier->is_active,
                'stock_in_count' => (int) $stockInCount,
            ],
            'stockIns' => $stockIns,
            'stockInMeta' => [
                'currentPage' => $stockInPaginator->currentPage(),
                'lastPage' => max(1, $stockInPaginator->lastPage()),
                'perPage' => $stockInPaginator->perPage(),
                'total' => $stockInPaginator->total(),
                'from' => $stockInPaginator->firstItem(),
                'to' => $stockInPaginator->lastItem(),
            ],
            'stockInFilters' => [
                'date' => $date,
                'reference' => $reference,
            ],
        ]);
    }

    private function filtersFrom(Request $request): array
    {
        $status = (string) $request->query('status', 'all');

        return [
            'search' => trim((string) $request->query('search', '')),
            'status' => in_array($status, ['all', 'active', 'inactive'], true) ? $status : 'all',
        ];
    }

    private function baseQuery(): Builder
    {
        return DB::table('suppliers')
            ->leftJoin('inventory_logs as stock_ins', function ($join) {
                $join->on('stock_ins.supplier_id', '=', 'suppliers.id')
                    ->whereIn('stock_ins.transaction_type', self::STOCK_IN_TYPES);
            })
            ->select([
                'suppliers.id',
                'suppliers.supplier_code',
                'suppliers.supplier_name',
                'suppliers.contact_person',
                'suppliers.phone',
                'suppliers.email',
                'suppliers.is_active',
            ])
            ->selectRaw('COUNT(stock_ins.id) as stock_in_count')
            ->groupBy(
                'suppliers.id',
                'suppliers.supplier_code',
                'suppliers.supplier_name',
                'suppliers.contact_person',
                'suppliers.phone',
                'suppliers.email',
                'suppliers.is_active'
            )
            ->orderBy('suppliers.supplier_name')
            ->orderBy('suppliers.id');
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        if ($filters['search'] !== '') {
            $term = $filters['search'];
            $query->where(function (Builder $inner) use ($term) {
                $inner->where('suppliers.supplier_name', 'ILIKE', '%'.$term.'%')
                    ->orWhere('suppliers.contact_person', 'ILIKE', '%'.$term.'%')
                    ->orWhere('suppliers.supplier_code', 'ILIKE', '%'.$term.'%');
            });
        }

        match ($filters['status']) {
            'active' => $query->where('suppliers.is_active', true),
            'inactive' => $query->where('suppliers.is_active', false),
            default => null,
        };
    }

    private function presentRow(object $s): array
    {
        return [
            'id' => (int) $s->id,
            'supplier_code' => $s->supplier_code,
            'supplier_name' => $s->supplier_name,
            'contact_person' => $s->contact_person,
            'phone' => $s->phone,
            'email' => $s->email,
            'is_active' => (bool) $s->is_active,
            'stock_in_count' => (int) $s->stock_in_count,
        ];
    }
}
