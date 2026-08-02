<?php

namespace App\Auth;

use App\Models\SupabaseUser;
use App\Services\SupabaseAuth;
use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Contracts\Session\Session;
use Illuminate\Http\Request;
use Override;
use RuntimeException;

class SupabaseGuard implements StatefulGuard
{
    use GuardHelpers;

    private string $sessionKey = 'supabase_auth';
    private bool $loggedOut = false;

    public function __construct(
        private SupabaseAuth $supabase,
        private Session $session,
        private ?Request $request = null,
    ) {


    }
    
    #[Override]
    public function attempt(array $credentials = [], $remember = false)
    {
        $tokens = $this->supabase->signIn($credentials['email'],$credentials['password']);
    }



    
}