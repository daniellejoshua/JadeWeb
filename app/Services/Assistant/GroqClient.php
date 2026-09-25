<?php

namespace App\Services\Assistant;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Throwable;

class GroqClient
{
    public function complete(array $messages, array $tools): array
    {
        $key = (string) config('services.groq.key');
        if ($key === '') {
            throw new GroqException('configuration', 'Groq API credentials are not configured.');
        }

        try {
            $response = Http::baseUrl(rtrim((string) config('services.groq.base_url'), '/'))
                ->withToken($key)
                ->acceptJson()
                ->asJson()
                ->connectTimeout(5)
                ->timeout(30)
                ->post('chat/completions', [
                    'model' => config('services.groq.model'),
                    'messages' => $messages,
                    'tools' => $tools,
                    'tool_choice' => 'auto',
                    'temperature' => 0,
                ]);
        } catch (ConnectionException $exception) {
            throw new GroqException('connection', 'Could not connect to Groq.');
        } catch (Throwable $exception) {
            throw new GroqException('transport', 'Groq request failed.');
        }

        if ($response->failed()) {
            $kind = match (true) {
                in_array($response->status(), [401, 403], true) => 'authentication',
                $response->status() === 429 => 'rate_limit',
                $response->serverError() => 'provider',
                default => 'request',
            };

            throw new GroqException($kind, 'Groq returned HTTP '.$response->status().'.');
        }

        $message = $response->json('choices.0.message');
        if (! is_array($message)) {
            throw new GroqException('invalid_response', 'Groq returned an invalid response.');
        }

        return $message;
    }
}
