<?php

namespace App\Services\Assistant;

use RuntimeException;

class GroqException extends RuntimeException
{
    public function __construct(public readonly string $kind, string $message)
    {
        parent::__construct($message);
    }
}
