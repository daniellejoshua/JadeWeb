<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssistantMessageRequest;
use App\Services\Assistant\AssistantOrchestrator;
use App\Services\Assistant\GroqException;
use Illuminate\Http\JsonResponse;

class AssistantController extends Controller
{
    public function message(AssistantMessageRequest $request, AssistantOrchestrator $assistant): JsonResponse
    {
        $validated = $request->validated();

        try {
            return response()->json($assistant->respond($validated['message'], $validated['history'] ?? []));
        } catch (GroqException $exception) {
            return response()->json([
                'answer' => 'The assistant provider is currently unavailable. Please try again later.',
                'blocks' => [],
                'citations' => [],
                'suggestions' => [],
                'asOf' => null,
                'warnings' => ['Assistant provider failure: '.$exception->kind.'.'],
            ], 503);
        }
    }
}
