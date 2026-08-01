<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class SupabaseAuth
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        private ?string $url = null,
        private ?string $anonKey = null)
    {
        $this->url ??= config('services.supabase.url');
        $this->anonKey ??= config('services.supabase.anon_key');
    }
    public function headers():array{
        return [
            'apikey' => $this->anonKey,
            'Authorization' => 'Bearer ' . $this->anonKey
        
        ];
    }

    public function signIn(string $email, string $password):array{
     $response = Http::withHeaders($this->headers())
     ->acceptJson()
     ->post($this->url .  '/auth/v1/token?grant_type=password', ['email'=>$email,'password' => $password] );
     if($response->failed()){
        throw new RuntimeException("Supabase sign-in failed"); 
 }
     return $response->json();
}


public function refreshToken(string $refreshToken):array{
    $response = Http::withHeaders($this->headers())
    ->acceptJson()
    ->post($this->url . '/auth/v1/token?grant_type=refresh_token',[
        'refresh_token'=> $refreshToken
    ]);
    if ($response->failed()){
        throw new RuntimeException("Supabase Token refresh failed");
    }
    return $response->json();
}
public function changePassword(string $accessToken, string $newPassword): void
    {
        $response = Http::withHeaders($this->headers())
            ->withToken($accessToken)
            ->acceptJson()
            ->put($this->url . '/auth/v1/user', [
                'password' => $newPassword,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Supabase password change failed.');
        }
    }

    public function signOut(string $accessToken): void
    {
        Http::withHeaders($this->headers())
            ->withToken($accessToken)
            ->acceptJson()
            ->post($this->url . '/auth/v1/logout');
    }

}