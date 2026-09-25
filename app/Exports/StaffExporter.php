<?php

namespace App\Exports;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StaffExporter
{
    public function download(?string $role, string $search = ''): StreamedResponse
    {
        $suffix = $role ? '-'.strtolower($role) : '';

        return response()->streamDownload(function () use ($role, $search): void {
            $output = fopen('php://output', 'w');

            fputcsv($output, ['Employee Code', 'Full Name', 'Username', 'Email', 'Phone', 'Role', 'Status'], ',', '"', '');

            foreach ($this->query($role, $search)->cursor() as $staff) {
                fputcsv($output, [
                    $this->safeCell($staff->employee_code),
                    $this->safeCell($staff->full_name),
                    $this->safeCell($staff->username),
                    $this->safeCell($staff->email),
                    $this->safeCell($staff->phone),
                    $this->safeCell($staff->user_role),
                    $staff->is_active ? 'Active' : 'Inactive',
                ], ',', '"', '');
            }

            fclose($output);
        }, 'jade-staff'.$suffix.'-'.now()->format('Y-m-d').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function query(?string $role, string $search): Builder
    {
        $searchOperator = DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

        return DB::table('users')
            ->select(['employee_code', 'full_name', 'username', 'email', 'phone', 'user_role', 'is_active'])
            ->when($role, fn (Builder $query) => $query->where('user_role', $role))
            ->when($search !== '', fn (Builder $query) => $query->where('full_name', $searchOperator, '%'.$search.'%'))
            ->orderBy('id');
    }

    private function safeCell(mixed $value): string
    {
        $value = (string) ($value ?? '');

        return preg_match('/^[=+\-@]/', $value) ? "'".$value : $value;
    }
}
