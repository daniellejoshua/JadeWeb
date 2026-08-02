<?php

namespace App\Models;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Support\Arrayable;

class SupabaseUser implements Authenticatable, Arrayable
{
    public function __construct(
        public readonly string $id,
        public readonly string $email,
        public readonly ?string $name,
        public readonly array $userMetadata,
        public readonly string $accessToken,
        public readonly string $refreshToken,
        public readonly int $expiresAt,
    ) {
    }

    public static function fromTokens(array $tokens): self
    {
        $user = $tokens['user'];

        return new self(
            id: $user['id'],
            email: $user['email'],
            name: $user['user_metadata']['full_name'] ?? null,
            userMetadata: $user['user_metadata'] ?? [],
            accessToken: $tokens['access_token'],
            refreshToken: $tokens['refresh_token'],
            expiresAt: (int) $tokens['expires_at'],
        );
    }

    public function tokenNeedsRefresh(int $leeway = 60): bool
    {
        return time() >= ($this->expiresAt - $leeway);
    }

    public function getAuthIdentifierName(): string
    {
        return 'id';
    }

    public function getAuthPasswordName():string
    {
        return 'password';
    }

    public function getAuthIdentifier(): string
    {
        return $this->id;
    }

    public function getAuthPassword(): ?string
    {
        return null;
    }

    public function getRememberToken(): ?string
    {
        return null;
    }

    public function setRememberToken($value): void
    {
    }

    public function getRememberTokenName(): ?string
    {
        return null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'name' => $this->name,
            'user_metadata' => $this->userMetadata,
        ];
    }
}