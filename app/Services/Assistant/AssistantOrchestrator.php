<?php

namespace App\Services\Assistant;

use Carbon\CarbonImmutable;

class AssistantOrchestrator
{
    private const MAX_ROUNDS = 5;

    private const MAX_TOOL_CALLS = 5;

    public function __construct(
        private readonly GroqClient $groq,
        private readonly AnalyticsTools $tools,
    ) {}

    public function respond(string $message, array $history = []): array
    {
        $messages = [['role' => 'system', 'content' => $this->systemPrompt()]];
        foreach ($history as $entry) {
            $messages[] = ['role' => $entry['role'], 'content' => $entry['content']];
        }
        $messages[] = ['role' => 'user', 'content' => $message];

        $results = [];
        $toolCalls = 0;
        $answer = null;

        for ($round = 0; $round < self::MAX_ROUNDS; $round++) {
            $assistant = $this->groq->complete($messages, $this->tools->definitions());
            $calls = is_array($assistant['tool_calls'] ?? null) ? $assistant['tool_calls'] : [];

            if ($calls === []) {
                $answer = trim((string) ($assistant['content'] ?? ''));
                break;
            }

            $messages[] = $this->assistantMessage($assistant);
            $remaining = self::MAX_TOOL_CALLS - $toolCalls;
            $limitReached = count($calls) > $remaining;

            foreach (array_slice($calls, 0, $remaining) as $call) {
                $toolCalls++;
                $name = (string) ($call['function']['name'] ?? '');
                $arguments = json_decode((string) ($call['function']['arguments'] ?? '{}'), true);
                $result = is_array($arguments)
                    ? $this->tools->execute($name, $arguments)
                    : $this->invalidArgumentsResult($name);

                $results[] = $result;
                $modelResult = $result;
                if (($modelResult['status'] ?? null) === 'ok') {
                    unset($modelResult['blocks'], $modelResult['warnings']);
                }
                $messages[] = [
                    'role' => 'tool',
                    'tool_call_id' => (string) ($call['id'] ?? ''),
                    'content' => json_encode($modelResult, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                ];
            }

            if ($limitReached) {
                $results[] = $this->limitResult();
                break;
            }
        }

        $successful = array_values(array_filter($results, fn (array $result) => $result['status'] === 'ok'));
        if ($answer === null || $answer === '') {
            $answer = 'I could not complete that request within the safe tool-call limit. Please narrow the question and try again.';
        }
        if ($this->isBusinessDataQuestion($message) && $successful === []) {
            $answer = 'I cannot answer that business-data question because no verified analytics result is available.';
        }
        if (count($successful) === 1 && $successful[0]['tool'] === 'data_freshness') {
            $answer = $successful[0]['data']['last_completed_sync']
                ? 'The latest synchronization details are shown below.'
                : 'No completed data synchronization is currently available.';
        }
        $answer = $this->appendMissingCitations($answer, $successful);

        return [
            'answer' => $answer,
            'blocks' => array_values(array_merge(...array_map(fn (array $result) => $result['blocks'], $successful))),
            'citations' => array_map(fn (array $result) => [
                'id' => $result['citation_id'],
                'tool' => $result['tool'],
                'as_of' => $result['as_of'],
            ], $successful),
            'suggestions' => $this->suggestions($successful),
            'asOf' => $successful === [] ? null : max(array_column($successful, 'as_of')),
            'warnings' => array_values(array_unique(array_merge(...array_map(fn (array $result) => $result['warnings'], $results)))),
        ];
    }

    private function systemPrompt(): string
    {
        $now = CarbonImmutable::now('Asia/Manila');

        return <<<PROMPT
You are a concise business assistant. Today is {$now->format('Y-m-d')}; current time is {$now->format('H:i:s')} in Asia/Manila.
All business calculations and factual business values must come only from the provided tools. Never calculate from memory, invent values, or imply unavailable data is zero.
Use only verified tool results. Never request, reveal, infer, or repeat personally identifiable information in the narrative. Staff names and employee codes may appear only in renderer-only staff_sales_ranking blocks, which are not provided to you. Do not provide medical advice.
Use payment_breakdown for payment-method mix and pie charts, including custom date ranges. Its pie measures order count; revenue is supporting data. Convert relative dates to YYYY-MM-DD and use the current Manila date for "now".
Use staff_summary for current headcount, staff_sales_by_role for privacy-safe role-level completed sales, and staff_sales_ranking when an authorized user asks who performed best. For broad "best staff" questions, use metric=all. Staff ranking rows are renderer-only: never identify or characterize the leader, and never claim the leader topped any component metric. State only the ranking basis and direct the user to the verified table.
Use supplier_summary for current supplier coverage and supplier_stock_ins for supplier receipt totals. Never expose supplier contact details.
Use stock_movement_summary for aggregate IN, OUT, and ADJUST trends, top_moved_products for product movement totals, and recent_inventory_activity for a bounded log list. Never expose staff identity, notes, or reference text. Describe OUT only as an OUT movement, not as a sale or dispatch unless verified separately.
Use data_freshness for synchronization questions. The verified freshness card displays the exact timestamp, so do not repeat that timestamp in the narrative.
Do not restate exact KPI, table, or chart values in the narrative; the verified blocks already contain them. Give only a brief conclusion, trend, exception, or action, and include each tool citation once. Do not output JSON or code fences.
For business-data questions, call the relevant tool before answering. Cite factual claims using the exact citation_id in square brackets, for example [sales_summary:last30].
If a tool reports unavailable or invalid arguments, state that the verified data is unavailable and do not guess. Keep the answer direct.
PROMPT;
    }

    private function assistantMessage(array $message): array
    {
        return [
            'role' => 'assistant',
            'content' => $message['content'] ?? null,
            'tool_calls' => $message['tool_calls'],
        ];
    }

    private function isBusinessDataQuestion(string $message): bool
    {
        return preg_match('/\b(sales?|revenue|orders?|profit|products?|inventory|stock|selling|sold|sync|freshness|business|performance|metrics?|reports?|compare|trend|top|best|staff|employees?|suppliers?|vendors?|restock|stock[- ]?ins?|stock[- ]?movements?|inventory logs?)\b/i', $message) === 1;
    }

    private function appendMissingCitations(string $answer, array $results): string
    {
        $citations = array_values(array_unique(array_filter(array_column($results, 'citation_id'))));
        foreach ($citations as $citation) {
            $pattern = '/[\[［【]\s*'.preg_quote($citation, '/').'\s*[\]］】]/u';
            $answer = preg_replace($pattern, '['.$citation.']', $answer) ?? $answer;
        }
        $missing = array_values(array_filter(
            $citations,
            fn (string $citation) => ! str_contains($answer, '['.$citation.']'),
        ));

        if ($missing === []) {
            return $answer;
        }

        return $answer."\n\nSources: ".implode(', ', array_map(fn (string $citation) => '['.$citation.']', $missing));
    }

    private function suggestions(array $results): array
    {
        $called = array_unique(array_column($results, 'tool'));
        $suggestions = [];

        if (array_intersect($called, ['sales_summary', 'sales_trend', 'compare_sales_periods', 'top_products'])) {
            $suggestions[] = 'Compare this month with last month';
            $suggestions[] = 'Show the top products for the last 30 days';
        }
        if (array_intersect($called, ['inventory_summary', 'stock_alerts'])) {
            $suggestions[] = 'Show all low-stock products';
            $suggestions[] = 'Summarize current inventory';
        }
        if (array_intersect($called, ['staff_summary', 'staff_sales_by_role', 'staff_sales_ranking'])) {
            $suggestions[] = 'How many active staff are there?';
            $suggestions[] = 'Rank staff by all sales metrics this month';
        }
        if (array_intersect($called, ['supplier_summary', 'supplier_stock_ins'])) {
            $suggestions[] = 'Which suppliers received the most units this month?';
            $suggestions[] = 'Summarize supplier coverage';
        }
        if (array_intersect($called, ['stock_movement_summary', 'top_moved_products', 'recent_inventory_activity'])) {
            $suggestions[] = 'Show recent inventory movements';
            $suggestions[] = 'Which products moved most this month?';
        }
        if ($called !== [] && ! in_array('data_freshness', $called, true)) {
            $suggestions[] = 'When was the data last synced?';
        }

        return array_slice(array_values(array_unique($suggestions)), 0, 3);
    }

    private function invalidArgumentsResult(string $tool): array
    {
        return ['status' => 'unavailable', 'tool' => $tool, 'as_of' => null, 'citation_id' => null, 'data' => [], 'warnings' => ['Tool arguments were not valid JSON.'], 'blocks' => []];
    }

    private function limitResult(): array
    {
        return ['status' => 'unavailable', 'tool' => 'tool_limit', 'as_of' => null, 'citation_id' => null, 'data' => [], 'warnings' => ['The safe limit of five tool calls was reached.'], 'blocks' => []];
    }
}
