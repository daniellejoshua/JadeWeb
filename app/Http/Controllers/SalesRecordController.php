<?php

namespace App\Http\Controllers;

use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Throwable;

class SalesRecordController extends Controller
{
    private const EWALLET_METHODS = ['GCash', 'Maya'];

    private const BUSINESS_TIMEZONE = 'Asia/Manila';

    private const PER_PAGE = 10;

    private const LIST_COLUMNS = [
        'sales.id',
        'sales.sale_number',
        'sales.sale_date',
        'sales.customer_name',
        'sales.user_id',
        'sales.total_amount',
        'sales.amount_paid',
        'sales.discount_amount',
        'sales.payment_method',
        'sales.reference',
        'sales.status',
        'sales.abort_reason',
    ];

    public function index(Request $request): \Inertia\Response
    {
        $filters = $this->filtersFrom($request);
        $perPage = self::PER_PAGE;
        $page = max(1, (int) $request->query('page', 1));

        try {
            $query = $this->baseQuery();
            $this->applyFilters($query, $filters);

            $paginator = $query->paginate($perPage, ['*'], 'page', $page)->withQueryString();

            if ($page > $paginator->lastPage()) {
                $paginator = $query->paginate($perPage, ['*'], 'page', $paginator->lastPage())
                    ->withQueryString();
            }

            $sales = collect($paginator->items())
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
            $sales = collect();
            $meta = [
                'currentPage' => 1,
                'lastPage' => 1,
                'perPage' => $perPage,
                'total' => 0,
                'from' => null,
                'to' => null,
            ];
        }

        return Inertia::render('SalesRecord', [
            'sales' => $sales,
            'meta' => $meta,
            'filters' => $filters,
        ]);
    }

    public function receipt(Request $request, int $id): JsonResponse
    {
        try {
            $sale = DB::table('sales')
                ->leftJoin('users', 'users.id', '=', 'sales.user_id')
                ->where('sales.id', $id)
                ->select([
                    'sales.id',
                    'sales.sale_number',
                    'sales.sale_date',
                    'sales.customer_name',
                    'sales.customer_tin',
                    'sales.user_id',
                    'sales.total_amount',
                    'sales.amount_paid',
                    'sales.discount_amount',
                    'sales.discount_type',
                    'sales.payment_method',
                    'sales.reference',
                    'sales.status',
                    'sales.abort_reason',
                ])
                ->selectRaw('users.full_name as user_name')
                ->first();

            if ($sale === null) {
                return response()->json(['message' => 'Sales record not found.'], 404);
            }

            $items = DB::table('sale_items as si')
                ->leftJoin('products as p', 'p.id', '=', 'si.product_id')
                ->where('si.sale_id', $id)
                ->orderBy('si.id')
                ->select([
                    'si.id',
                    'si.quantity',
                    'si.unit_price',
                    'si.original_unit_price',
                    'si.line_discount',
                    'si.sub_total',
                ])
                ->selectRaw('p.product_name, p.product_code, p.unit')
                ->get()
                ->map(fn ($i) => [
                    'id' => (int) $i->id,
                    'product_name' => $i->product_name,
                    'product_code' => $i->product_code,
                    'unit' => $i->unit,
                    'quantity' => (int) $i->quantity,
                    'unit_price' => round((float) $i->unit_price, 2),
                    'original_unit_price' => $i->original_unit_price !== null
                        ? round((float) $i->original_unit_price, 2)
                        : null,
                    'line_discount' => round((float) $i->line_discount, 2),
                    'sub_total' => $i->sub_total !== null ? round((float) $i->sub_total, 2) : 0.0,
                ])
                ->values();

            $company = DB::table('company_settings')
                ->where('is_active', true)
                ->first();
        } catch (Throwable) {
            return response()->json(['message' => 'Unable to load this receipt.'], 500);
        }

        return response()->json([
            'sale' => [
                'id' => (int) $sale->id,
                'sale_number' => $sale->sale_number,
                'sale_date' => $sale->sale_date,
                'customer_name' => $sale->customer_name,
                'customer_tin' => $sale->customer_tin,
                'user_name' => $sale->user_name,
                'total_amount' => round((float) $sale->total_amount, 2),
                'amount_paid' => round((float) $sale->amount_paid, 2),
                'discount_amount' => round((float) $sale->discount_amount, 2),
                'discount_type' => $sale->discount_type,
                'payment_method' => $sale->payment_method,
                'reference' => $sale->reference,
                'status' => $sale->status,
                'abort_reason' => $sale->abort_reason,
            ],
            'items' => $items,
            'company' => $company === null ? null : [
                'company_name' => $company->company_name,
                'tin' => $company->tin,
                'address' => $company->address,
                'phone' => $company->phone,
                'email' => $company->email,
                'website' => $company->website,
                'logo_url' => $company->logo_url,
                'bir_auth_number' => $company->bir_auth_number,
                'ptu_number' => $company->ptu_number,
                'receipt_footer' => $company->receipt_footer,
            ],
        ]);
    }

    private function filtersFrom(Request $request): array
    {
        $payment = (string) $request->query('payment', 'all');
        $status = (string) $request->query('status', 'all');

        return [
            'search' => trim((string) $request->query('search', '')),
            'payment' => in_array($payment, ['all', 'cash', 'ewallet', 'card'], true) ? $payment : 'all',
            'status' => in_array($status, ['all', 'completed', 'aborted'], true) ? $status : 'all',
            'date' => $this->dateOrEmpty($request->query('date')),
        ];
    }

    private function dateOrEmpty(mixed $value): string
    {
        $value = trim((string) $value);

        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1 ? $value : '';
    }

    private function baseQuery(): Builder
    {
        return DB::table('sales')
            ->leftJoin('users', 'users.id', '=', 'sales.user_id')
            ->select(self::LIST_COLUMNS)
            ->selectRaw('users.username as created_by, users.full_name as user_name')
            ->selectRaw("COALESCE(sales.sales_data::jsonb #>> '{payment,discount,type}', sales.discount_type) as discount_type")
            ->selectRaw("COALESCE((sales.sales_data::jsonb #>> '{payment,discount,amount}')::numeric, sales.discount_amount, 0) as discount_amount")
            ->orderByDesc('sales.sale_date')
            ->orderByDesc('sales.id');
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        if ($filters['search'] !== '') {
            $term = $filters['search'];
            $query->where(function (Builder $inner) use ($term) {
                $inner->where('sales.sale_number', 'ILIKE', '%' . $term . '%')
                    ->orWhereRaw('CAST(sales.id AS TEXT) = ?', [$term]);
            });
        }

        match ($filters['payment']) {
            'cash' => $query->whereRaw('LOWER(sales.payment_method) = ?', ['cash']),
            'card' => $query->whereRaw('LOWER(sales.payment_method) = ?', ['card']),
            'ewallet' => $query->whereIn('sales.payment_method', self::EWALLET_METHODS),
            default => null,
        };

        match ($filters['status']) {
            'completed' => $query->whereRaw('LOWER(sales.status) = ?', ['completed']),
            'aborted' => $query->whereRaw('LOWER(sales.status) = ?', ['aborted']),
            default => null,
        };

        if ($filters['date'] !== '') {
            $query->whereRaw(
                "(sales.sale_date AT TIME ZONE ?)::date = ?",
                [self::BUSINESS_TIMEZONE, $filters['date']]
            );
        }
    }

    private function presentRow(object $s): array
    {
        $discountType = trim((string) ($s->discount_type ?? ''));
        $totalAmount = round((float) $s->total_amount, 2);
        $amountPaid = round((float) $s->amount_paid, 2);

        return [
            'id' => (int) $s->id,
            'order_id' => str_pad((string) $s->id, 6, '0', STR_PAD_LEFT),
            'sale_number' => $s->sale_number,
            'sale_date' => $s->sale_date,
            'customer_name' => $s->customer_name,
            'user_id' => $s->user_id !== null ? (int) $s->user_id : null,
            'created_by' => $s->created_by,
            'user_name' => $s->user_name,
            'total_amount' => $totalAmount,
            'amount_paid' => $amountPaid,
            'change' => round($amountPaid - $totalAmount, 2),
            'discount_type' => $discountType !== '' ? $discountType : null,
            'discount_amount' => round((float) $s->discount_amount, 2),
            'payment_method' => $s->payment_method,
            'reference' => $s->reference,
            'status' => $s->status,
            'abort_reason' => $s->abort_reason,
        ];
    }
}
