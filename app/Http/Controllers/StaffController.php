<?php

namespace App\Http\Controllers;

use App\Exports\StaffExporter;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class StaffController extends Controller
{
    private const PER_PAGE = 50;

    private const ROLES = ['Admin', 'Manager', 'Staff'];

    public function index(Request $request): Response
    {
        $viewerRole = $this->viewerRole($request);
        $accessDenied = ! in_array($viewerRole, ['Admin', 'Administrator', 'Manager'], true);
        $role = $this->filteredRole($request);
        $search = trim((string) $request->query('search', ''));

        if ($accessDenied) {
            return Inertia::render('Staff', $this->emptyPage($role, $search, $viewerRole, true));
        }

        $page = max(1, (int) $request->query('page', 1));

        try {
            $query = $this->staffQuery($role, $search);
            $paginator = $query->paginate(self::PER_PAGE, ['*'], 'page', $page)->withQueryString();

            if ($page > $paginator->lastPage()) {
                $paginator = $query->paginate(self::PER_PAGE, ['*'], 'page', $paginator->lastPage())
                    ->withQueryString();
            }

            $staff = collect($paginator->items())->map(fn (object $row) => $this->present($row))->values();
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
            $staff = collect();
            $meta = $this->emptyMeta();
        }

        return Inertia::render('Staff', [
            'staff' => $staff,
            'meta' => $meta,
            'filters' => ['role' => $role ?? 'all', 'search' => $search],
            'viewerRole' => $viewerRole,
            'accessDenied' => false,
        ]);
    }

    public function show(Request $request, int $staff): JsonResponse
    {
        abort_unless($this->canAccess($request), 403, 'Access denied');

        $row = $this->staffQuery()->where('id', $staff)->first();
        abort_if(! $row, 404);

        return response()->json([
            ...$this->present($row),
            'qr_value' => $row->employee_code ?: 'JADE-STAFF-'.$row->id,
        ]);
    }

    public function export(Request $request, StaffExporter $exporter): StreamedResponse
    {
        abort_unless($this->canAccess($request), 403, 'Access denied');

        return $exporter->download(
            $this->filteredRole($request),
            trim((string) $request->query('search', '')),
        );
    }

    private function staffQuery(?string $role = null, string $search = ''): Builder
    {
        $searchOperator = DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

        return DB::table('users')
            ->select([
                'id',
                'employee_code',
                'full_name',
                'username',
                'email',
                'phone',
                'user_role',
                'is_active',
                'photo_url',
            ])
            ->when($role, fn ($query) => $query->where('user_role', $role))
            ->when($search !== '', fn (Builder $query) => $query->where('full_name', $searchOperator, '%'.$search.'%'))
            ->orderBy('id');
    }

    private function present(object $row): array
    {
        return [
            'id' => (int) $row->id,
            'employee_code' => $row->employee_code,
            'full_name' => $row->full_name,
            'username' => $row->username,
            'email' => $row->email,
            'phone' => $row->phone,
            'user_role' => $row->user_role,
            'is_active' => (bool) $row->is_active,
            'photo_url' => $row->photo_url,
        ];
    }

    private function filteredRole(Request $request): ?string
    {
        $role = (string) $request->query('role', 'all');

        return in_array($role, self::ROLES, true) ? $role : null;
    }

    private function viewerRole(Request $request): string
    {
        return (string) data_get($request->user()?->userMetadata, 'role', '');
    }

    private function canAccess(Request $request): bool
    {
        return in_array($this->viewerRole($request), ['Admin', 'Administrator', 'Manager'], true);
    }

    private function emptyPage(?string $role, string $search, string $viewerRole, bool $accessDenied): array
    {
        return [
            'staff' => [],
            'meta' => $this->emptyMeta(),
            'filters' => ['role' => $role ?? 'all', 'search' => $search],
            'viewerRole' => $viewerRole,
            'accessDenied' => $accessDenied,
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
