<?php

// static function in a class = machine that uses the blueprint (class)
// methods = function in the class
// instance = the produced object that produces a new class
// not every method produces an object. Only the factory method (or new keyword) does

namespace App\Auth;

use App\Models\SupabaseUser;
use App\Services\SupabaseAuth;
use BadMethodCallException;
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
    ) {}

    #[Override]
    public function attempt(array $credentials = [], $remember = false): bool
    {

        try {
            $tokens = $this->supabase->signIn($credentials['email'], $credentials['password']);

        } catch (RuntimeException) {
            return false;
        }
        $role = $tokens['user']['user_metadata']['role'] ?? null;
        if ($role !== 'Admin') {
            return false;
        }

        $this->storeTokens($tokens);
        $this->user = SupabaseUser::fromTokens($tokens);

        return true;
    }

    #[Override]
    public function once(array $credentials = [])
    {
        return $this->attempt($credentials);
    }

    public function viaRemember(): bool
    {
        return false;
    }

    #[Override]
    public function user(): ?Authenticatable
    {
        if ($this->loggedOut) {
            return null;
        }
        if ($this->user !== null) {
            return $this->user;
        }

        $this->user = $this->userFromSession();
        $this->refreshTokenIfNeeded();

        return $this->user;
    }

    private function userFromSession(): ?SupabaseUser
    {
        $session = $this->session->get($this->sessionKey);
        if (! is_array($session)) {
            return null;
        }

        if (! isset($session['user'],$session['access_token'],$session['refresh_token'],$session['expires_at'])) {
            return null;
        }
        $sessionArray = [
            'user' => $session['user'],
            'access_token' => $session['access_token'],
            'refresh_token' => $session['refresh_token'],
            'expires_at' => (int) $session['expires_at'],
        ];

        return SupabaseUser::fromTokens($sessionArray);

    }

    #[Override]
    public function logout()
    {
        $session = $this->session->get($this->sessionKey);

        if (is_array($session) && isset($session['access_token'])) {
            try {
                $this->supabase->signOut($session['access_token']);
            } catch (RuntimeException) {

            }

        }
        $this->session->remove($this->sessionKey);
        $this->loggedOut = true;
        $this->user = null;
    }

    #[Override]
    public function validate(array $credentials = []): bool
    {
        try {
            $this->supabase->signIn($credentials['email'], $credentials['password']);

            return true;
        } catch (RuntimeException) {
            return false;
        }
    }

    public function refreshTokenIfNeeded()
    {
        $user = $this->user;

        if ($this->loggedOut || ! $user instanceof SupabaseUser || ! $user->tokenNeedsRefresh()) {
            return;

        }
        try {
            $tokens = $this->supabase->refreshToken($this->user->refreshToken);
        } catch (RuntimeException) {
            $this->logout();

            return;
        }
        $this->storeTokens($tokens);
        $this->user = SupabaseUser::fromTokens($tokens);

    }

    private function storeTokens(array $tokens): void
    {
        $this->session->put($this->sessionKey, [
            'user' => $tokens['user'],
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
            'expires_at' => (int) $tokens['expires_at'],
        ]);
    }

    // NOT SUPPORTED BY SUPABASE GUARD
    #[Override]
    public function login(Authenticatable $user, $remember = false)
    {
        throw new BadMethodCallException('NOT SUPPORTED BY SUPABASE GUARD ');
    }

    #[Override]
    public function onceUsingId($id)
    {
        throw new BadMethodCallException('NOT SUPPORTED BY SUPABASE GUARD ');
    }

    #[Override]
    public function loginUsingId($id, $remember = false)
    {
        throw new BadMethodCallException('NOT SUPPORTED BY SUPABASE GUARD ');
    }
}

