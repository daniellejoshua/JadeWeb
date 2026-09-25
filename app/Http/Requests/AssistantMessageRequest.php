<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class AssistantMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = (string) data_get($this->user()?->userMetadata, 'role', '');

        return in_array($role, ['Admin', 'Administrator', 'Manager'], true);
    }

    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'max:1500'],
            'history' => ['sometimes', 'array', 'max:12'],
            'history.*' => ['required', 'array:role,content'],
            'history.*.role' => ['required', Rule::in(['user', 'assistant'])],
            'history.*.content' => ['required', 'string', 'max:4000'],
        ];
    }

    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
