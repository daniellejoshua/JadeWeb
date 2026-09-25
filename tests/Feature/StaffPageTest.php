<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StaffPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('users', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('employee_code')->nullable();
            $table->string('full_name');
            $table->string('username');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('user_role')->nullable();
            $table->boolean('is_active')->nullable();
            $table->string('photo_url')->nullable();
        });

        DB::table('users')->insert([
            [
                'id' => 1,
                'employee_code' => 'EMP-002',
                'full_name' => 'Mara Manager',
                'username' => 'mmanager',
                'email' => 'manager@example.com',
                'phone' => '09170000002',
                'user_role' => 'Manager',
                'is_active' => true,
                'photo_url' => null,
            ],
            [
                'id' => 2,
                'employee_code' => 'EMP-001',
                'full_name' => 'Sam Staff',
                'username' => 'sstaff',
                'email' => 'staff@example.com',
                'phone' => null,
                'user_role' => 'Staff',
                'is_active' => false,
                'photo_url' => null,
            ],
        ]);
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/staff')->assertRedirect('/login');
    }

    public function test_admin_can_filter_the_staff_list_by_role(): void
    {
        $this->asRole('Admin')
            ->get('/staff?role=Staff')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Staff')
                ->where('filters.role', 'Staff')
                ->where('accessDenied', false)
                ->has('staff', 1)
                ->where('staff.0.employee_code', 'EMP-001')
                ->where('staff.0.id', 2)
                ->where('meta.perPage', 50));
    }

    public function test_manager_can_view_but_cannot_manage_staff(): void
    {
        $this->asRole('Manager', 'manager@example.com')
            ->get('/staff')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('viewerRole', 'Manager')
                ->where('accessDenied', false));
    }

    public function test_staff_can_be_searched_by_name(): void
    {
        $this->asRole('Admin')
            ->get('/staff?search=Mara')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.search', 'Mara')
                ->has('staff', 1)
                ->where('staff.0.full_name', 'Mara Manager'));
    }

    public function test_other_roles_receive_the_access_denied_page(): void
    {
        $this->asRole('Staff', 'staff@example.com')
            ->get('/staff')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('accessDenied', true)
                ->has('staff', 0));
    }

    public function test_staff_detail_is_fetched_for_the_id_card(): void
    {
        $this->asRole('Admin')
            ->getJson('/staff/1')
            ->assertOk()
            ->assertJsonPath('employee_code', 'EMP-002')
            ->assertJsonPath('qr_value', 'EMP-002');
    }

    public function test_export_contains_only_the_filtered_role(): void
    {
        $response = $this->asRole('Admin')->get('/staff/export?role=Staff');

        $response->assertOk()->assertDownload();

        $csv = $response->streamedContent();
        $this->assertStringContainsString('EMP-001', $csv);
        $this->assertStringNotContainsString('EMP-002', $csv);
    }

    public function test_export_respects_the_name_search(): void
    {
        $response = $this->asRole('Admin')->get('/staff/export?search=Mara');

        $response->assertOk()->assertDownload();

        $csv = $response->streamedContent();
        $this->assertStringContainsString('Mara Manager', $csv);
        $this->assertStringNotContainsString('Sam Staff', $csv);
    }

    private function asRole(string $role, string $email = 'admin@example.com'): static
    {
        return $this->withSession([
            'supabase_auth' => [
                'user' => [
                    'id' => 'auth-user-id',
                    'email' => $email,
                    'user_metadata' => [
                        'full_name' => 'Test User',
                        'role' => $role,
                    ],
                ],
                'access_token' => 'test-access-token',
                'refresh_token' => 'test-refresh-token',
                'expires_at' => now()->addHour()->timestamp,
            ],
        ]);
    }
}
