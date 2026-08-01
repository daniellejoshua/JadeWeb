# JadeWeb — Data Assistant Plan (AI)

An AI assistant that answers questions about the clinic's dashboard data:
sales, inventory, products, and suppliers.

**Design principle:** *Narrow but deep, not wide but shallow.* The AI understands
the question, picks a pre-written computation, and narrates the result. The math
lives in deterministic, tested PHP — never in the model.

---

## 1. Architecture (all-Laravel, no Python, no vector DB)

```
User → React Chat page → POST /chat (auth-guarded)
                          → ChatController
                              → query-tools layer (whitelisted, parameterized SQL)
                              → GroqService (chat completions)
                          → answer + citations → React
```

| Piece | Choice | Reason |
|-------|--------|--------|
| App | Laravel + React/Inertia | Same stack as the dashboard |
| Model | Groq (chat completions) | Fast, cheap; key stays in `.env` |
| Data access | Direct Supabase Postgres (read-only role) | Existing connection |
| Vector DB | **None** | Structured data is searched with SQL, not embeddings |
| Python | **None** | No PDFs/OCR/servers to run |

No PDF uploads. The assistant is grounded entirely in the dashboard's synced
tables (`products`, `sales`, `sale_items`, `inventory_logs`, `suppliers`,
`users`, `company_settings`, `sync_log`).

---

## 2. Bounded agentic loop (not one-shot Q&A)

A real assistant answers *chains*, e.g. **"Why did sales drop this week?"**

```
user: "Why did sales drop this week?"
  → model: call sales_trend(this_week)
  → model: call compare_periods(this_week, last_week)
  → model: call top_products(this_week)
  → model writes the final story with citations
```

- `ChatController` runs the loop (max ~6 tool steps per turn).
- Each tool is whitelisted, parameterized, SELECT-only.
- The model picks **from a catalog** — it never writes SQL.

Division of labor:
1. AI **understands** the question
2. AI **picks** the right computation(s) + params
3. PHP **computes** (deterministic, tested)
4. AI **narrates** with citations

---

## 3. Capability catalog (first batch, mapped to real schema)

### Sales
| Capability | Params | What it returns |
|------------|--------|-----------------|
| `kpi_sales` | range | total, transactions, avg/sale, items sold, payment split (filters `is_void`) |
| `sales_trend` | range, granularity | daily/weekly/monthly series + direction |
| `top_products` | range, limit | best sellers by qty & revenue |
| `slow_movers` | range, limit | least sold products |
| `sales_by_cashier` | range | per staff member |
| `compare_periods` | period A, B | period-over-period delta + biggest movers |

### Inventory
| Capability | Params | What it returns |
|------------|--------|-----------------|
| `stock_summary` | — | item count, stock value (cost & selling), category breakdown |
| `low_stock` | limit | `current_stock <= reorder_level` |
| `out_of_stock` | — | `current_stock = 0` |
| `expiring` | within_days | `has_expiry` + `expiry_date` within window |
| `stock_movement` | product, range | IN/OUT/ADJUST from `inventory_logs` |

### Business
| Capability | Params | What it returns |
|------------|--------|-----------------|
| `suppliers_report` | — | suppliers + product counts |
| `company_profile` | — | from `company_settings` (TIN, PTU, receipt info) |
| `data_freshness` | — | last `sync_log` → "data as of [last sync]" |

**Adding a capability** = one PHP method + tool definition + unit test.

---

## 4. Memory

New tables (web-app-owned, never touched by LAN sync):

- `chat_sessions` — id, user_id, title, timestamps
- `chat_messages` — id, session_id, role (`user`/`assistant`), content, `tool_result` (json), timestamps
- `chat_log` — audit trail of every AI question (who, when, question)

Memory = send the last ~20 messages back with each turn. Session title
auto-generated from the first question.

---

## 5. Assistant feel layer

- **Markdown answers** with headings, bullets, tables — rendered via `react-markdown`
- **Follow-up suggestions** — 2–3 "Want to see…" chips after each answer
- **Citations** — every number links to its tool result (rendered from `tool_result`, not the model)
- **Freshness caveat** — assistant states "data as of [last sync]" from `data_freshness`
- **Consistent formatting** — PHP formats ₱ values; model repeats them verbatim

---

## 6. Accuracy & trust (hard rules)

1. **Date injection** — "Today is {date}" in the system prompt AND named ranges
   (`yesterday`, `this_week`, `last_month`) resolved by Carbon in PHP, never by the model.
2. **Citations** — tool results come from code; the model may only state numbers
   present in them.
3. **Fuzzy product matching** — `ILIKE` match; ambiguous names → model must ask
   ("Paracetamol 500mg or 250mg?"); zero matches → "we don't carry that."
4. **Honest fallback** — system prompt: "answer only about sales, inventory,
   products, suppliers." Code guard: a reply with **no tool call** is replaced by
   the canned fallback — every real answer must be grounded in a tool call.

---

## 7. Safety

- Read-only DB role/connection for all tool SQL
- No free-form text-to-SQL — catalog only
- The assistant reads synced tables, writes only to its own tables
- Every question logged to `chat_log`

---

## 8. Deployment prerequisites

- VPS with Laravel (php-fpm) — nothing exotic
- `GROQ_API_KEY` in `.env` (server-side only)
- Queue worker not required for this feature
- No `tesseract`, no vector extension, no OCR

---

## 9. Honest limitation

The assistant answers everything in the catalog; truly arbitrary ad-hoc analytics
require adding a capability. Refusal is the intended failure mode —
**a refusal is cheaper than a wrong number.**

---

## 10. Open decisions

- [ ] First catalog batch: **Sales & trends**, **Inventory/stock alerts**, or both?
- [ ] **Proactive digests** (auto "morning briefing": KPIs + low stock) — in scope now or later?

---

## 11. Phasing

| Phase | Work | Status |
|-------|------|--------|
| 1 | Auth guard (Supabase GoTrue, Option B) | in progress |
| 2 | Dashboard shell + placeholder reports | after |
| 3 | Data assistant (this plan) | after |
