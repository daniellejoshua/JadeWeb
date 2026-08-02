<?php

namespace App\Auth;

use App\Models\SupabaseUser;
use App\Services\SupabaseAuth;
use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Contracts\Session\Session;
use Illuminate\Http\Request;
use Inertia\SessionKey;
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
    public function attempt(array $credentials = [], $remember = false):bool
    {

        try{
        $tokens = $this->supabase->signIn($credentials['email'],$credentials['password']);

        }catch(RuntimeException){
            return false;
        }
        $role = $tokens['user']['user_metadata']['role'] ?? null;
        if ($role !== "Admin"){
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



    #[Override]
    public function user(): ?Authenticatable
    {
    if ($this->loggedOut){
        return null;
    }
    if($this->user !== null){
        return $this->user;
    }

    $this->user = $this->userFromSession();
    $this->refreshTokenIfNeeded();
    return $this->user;
 }


 private function userFromSession(): ?SupabaseUser
 {
 $session = $this->session->get($this->sessionKey);
    if (! is_array($session)){
        return null;
    }

    if (! isset($session['user'],$session['accessToken'],$session['refreshToken'],$session['expires_at'])){
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


 public function refreshTokenIfNeeded(){

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


    
}

//  public function attempt(array $credentials = [], bool $remember = false): bool
//     {
//         try {
//             $tokens = $this->supabase->signIn($credentials['email'], $credentials['password']);
//         } catch (RuntimeException) {
//             return false;
//         }

//         $role = $tokens['user']['user_metadata']['role'] ?? null;

//         if ($role !== 'Admin') {
//             return false;
//         }

//         $this->storeTokens($tokens);
//         $this->user = SupabaseUser::fromTokens($tokens);

//         return true;
//     }

//     public function user(): ?Authenticatable
//     {
//         if ($this->loggedOut) {
//             return null;
//         }

//         if ($this->user === null) {
//             $this->user = $this->userFromSession();
//         }

//         $this->refreshTokenIfNeeded();

//         return $this->user;
//     }

//     public function refreshTokenIfNeeded(): void
//     {
//         $user = $this->user;

//         if ($this->loggedOut || ! $user instanceof SupabaseUser || ! $user->tokenNeedsRefresh()) {
//             return;
//         }

//         try {
//             $tokens = $this->supabase->refreshToken($user->refreshToken);
//         } catch (RuntimeException) {
//             $this->logout();

//             return;
//         }

//         $this->storeTokens($tokens);
//         $this->user = SupabaseUser::fromTokens($tokens);
//     }

//     public function logout(): void
//     {
//         $session = $this->session->get(self::SESSION_KEY);

//         if (is_array($session) && isset($session['access_token'])) {
//             try {
//                 $this->supabase->signOut($session['access_token']);
//             } catch (RuntimeException) {
//                 // Best effort - the GoTrue token may already be revoked.
//             }
//         }

//         $this->session->remove(self::SESSION_KEY);
//         $this->user = null;
//         $this->loggedOut = true;
//     }

//     public function validate(array $credentials = []): bool
//     {
//         try {
//             $this->supabase->signIn($credentials['email'], $credentials['password']);

//             return true;
//         } catch (RuntimeException) {
//             return false;
//         }
//     }

//     public function once(array $credentials = []): bool
//     {
//         return $this->attempt($credentials);
//     }

//     public function viaRemember(): bool
//     {
//         return false;
//     }

//     private function userFromSession(): ?SupabaseUser
//     {
//         $session = $this->session->get(self::SESSION_KEY);

//         if (! is_array($session)) {
//             return null;
//         }

//         if (! isset($session['user'], $session['access_token'], $session['refresh_token'], $session['expires_at'])) {
//             return null;
//         }

//         return SupabaseUser::fromTokens([
//             'user' => $session['user'],
//             'access_token' => $session['access_token'],
//             'refresh_token' => $session['refresh_token'],
//             'expires_at' => $session['expires_at'],
//         ]);
//     }

//     private function storeTokens(array $tokens): void
//     {
//         $this->session->put(self::SESSION_KEY, [
//             'user' => $tokens['user'],
//             'access_token' => $tokens['access_token'],
//             'refresh_token' => $tokens['refresh_token'],
//             'expires_at' => (int) $tokens['expires_at'],
//         ]);
//     }
// }