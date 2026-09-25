import { Button } from '@/components/ui/button';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    ArrowRight,
    ArrowUp,
    BarChart3,
    Package,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Square,
    Truck,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from 'recharts';
import remarkGfm from 'remark-gfm';
import { route } from 'ziggy-js';

type HistoryMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type KpiGridBlock = {
    type: 'kpi_grid';
    items: Array<{ label: string; value: string | number; detail?: string }>;
};

type ChartBlock = {
    type: 'line_chart' | 'bar_chart' | 'pie_chart';
    title: string;
    data: Array<Record<string, string | number>>;
    xKey: string;
    series: Array<{ key: string; label: string; color?: string }>;
};

type TableBlock = {
    type: 'table';
    title: string;
    columns: Array<{ key: string; label: string }>;
    rows: Array<Record<string, string | number | null>>;
};

type RecommendationsBlock = {
    type: 'recommendations';
    items: Array<{ title: string; reason: string; action?: string; severity?: string }>;
};

export type AssistantBlock = KpiGridBlock | ChartBlock | TableBlock | RecommendationsBlock;

export type AssistantResponse = {
    answer: string;
    blocks: AssistantBlock[];
    citations: Array<{ id: string; label?: string; tool?: string; as_of?: string }>;
    suggestions: string[];
    asOf: string | null;
    warnings: string[];
};

type ChatMessage = HistoryMessage & {
    id: string;
    response?: AssistantResponse;
};

type AiAssistantChatProps = {
    embedded?: boolean;
    fill?: boolean;
};

const JADE_IMAGE = '/jadeAssistantAnimation/JadeAIAssistant.png';

const INSIGHT_GROUPS: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
    questions: string[];
}> = [
    {
        title: 'Sales insights',
        description: 'View sales reports, compare performance, and analyze trends.',
        icon: BarChart3,
        questions: ['Create a monthly sales report', 'Compare this month with last month'],
    },
    {
        title: 'Inventory insights',
        description: 'Check product movement, stock levels, and top items.',
        icon: Package,
        questions: ['Which products moved most this month?', 'Show recent inventory movements'],
    },
    {
        title: 'Staff insights',
        description: 'Analyze staff performance and sales metrics.',
        icon: Users,
        questions: ['Rank staff by all sales metrics this month'],
    },
    {
        title: 'Supplier insights',
        description: 'Review supplier coverage and product availability.',
        icon: Truck,
        questions: ['Summarize supplier coverage'],
    },
];

const CHART_COLORS = ['#C49A2C', '#16A34A', '#D97706', '#7C6FAD'];
const numberFormatter = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 });
const compactNumberFormatter = new Intl.NumberFormat('en-PH', {
    compactDisplay: 'short',
    maximumFractionDigits: 1,
    notation: 'compact',
});

function formatChartValue(value: number, label: string): string {
    const formatted = compactNumberFormatter.format(value);
    return /cost|discount|profit|revenue|value|amount/i.test(label) ? `₱${formatted}` : formatted;
}

function formatTableValue(value: string | number | null, key: string): string {
    if (value === null) return '—';
    if (typeof value === 'string') return value;
    if (key.endsWith('_share_percent')) return `${numberFormatter.format(value)}%`;
    if (key === 'change_percent') return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
    if (/cost|discount|profit|revenue|value|amount/i.test(key)) {
        return `₱${numberFormatter.format(value)}`;
    }
    return numberFormatter.format(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function parseBlock(value: unknown): AssistantBlock | null {
    if (!isRecord(value) || !isString(value.type)) return null;

    if (value.type === 'kpi_grid' && Array.isArray(value.items)) {
        const items = value.items.filter(
            (item): item is KpiGridBlock['items'][number] =>
                isRecord(item) &&
                isString(item.label) &&
                (typeof item.value === 'string' || typeof item.value === 'number') &&
                (item.detail === undefined || typeof item.detail === 'string'),
        );
        return items.length ? { type: 'kpi_grid', items } : null;
    }

    if (
        (value.type === 'line_chart' || value.type === 'bar_chart' || value.type === 'pie_chart') &&
        isString(value.title) &&
        isString(value.xKey) &&
        Array.isArray(value.data) &&
        Array.isArray(value.series)
    ) {
        const data = value.data.filter((row): row is Record<string, string | number> =>
            isRecord(row) && Object.values(row).every((cell) => typeof cell === 'string' || typeof cell === 'number'),
        );
        const series = value.series.filter(
            (item): item is ChartBlock['series'][number] =>
                isRecord(item) &&
                isString(item.key) &&
                isString(item.label) &&
                (item.color === undefined || typeof item.color === 'string'),
        );
        const xKey = value.xKey;
        if (
            !data.length ||
            !series.length ||
            !data.every((row) => xKey in row) ||
            !series.every((item) => data.every((row) => typeof row[item.key] === 'number'))
        ) return null;
        return { type: value.type, title: value.title, xKey, data, series };
    }

    if (value.type === 'table' && isString(value.title) && Array.isArray(value.columns) && Array.isArray(value.rows)) {
        const columns = value.columns.filter(
            (column): column is TableBlock['columns'][number] =>
                isRecord(column) && isString(column.key) && isString(column.label),
        );
        const rows = value.rows.filter((row): row is Record<string, string | number | null> =>
            isRecord(row) && Object.values(row).every((cell) => cell === null || typeof cell === 'string' || typeof cell === 'number'),
        );
        return columns.length ? { type: 'table', title: value.title, columns, rows } : null;
    }

    if (value.type === 'recommendations' && Array.isArray(value.items)) {
        const items = value.items.filter(
            (item): item is RecommendationsBlock['items'][number] =>
                isRecord(item) &&
                isString(item.title) &&
                isString(item.reason) &&
                (item.action === undefined || typeof item.action === 'string') &&
                (item.severity === undefined || typeof item.severity === 'string'),
        );
        return items.length ? { type: 'recommendations', items } : null;
    }

    return null;
}

function parseResponse(value: unknown): AssistantResponse {
    if (!isRecord(value) || typeof value.answer !== 'string') {
        throw new Error('The assistant returned an unexpected response. Please try again.');
    }

    const citations = Array.isArray(value.citations)
        ? value.citations.filter(
              (citation): citation is AssistantResponse['citations'][number] =>
                  isRecord(citation) &&
                  isString(citation.id) &&
                  (citation.label === undefined || typeof citation.label === 'string') &&
                  (citation.tool === undefined || typeof citation.tool === 'string') &&
                  (citation.as_of === undefined || typeof citation.as_of === 'string'),
          )
        : [];

    return {
        answer: value.answer,
        blocks: Array.isArray(value.blocks)
            ? value.blocks.map(parseBlock).filter((block): block is AssistantBlock => block !== null)
            : [],
        citations,
        suggestions: Array.isArray(value.suggestions) ? value.suggestions.filter(isString) : [],
        asOf: typeof value.asOf === 'string' ? value.asOf : null,
        warnings: Array.isArray(value.warnings) ? value.warnings.filter(isString) : [],
    };
}

function csrfHeaders(): Record<string, string> {
    const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    if (token) return { 'X-CSRF-TOKEN': token };

    const cookie = document.cookie
        .split('; ')
        .find((entry) => entry.startsWith('XSRF-TOKEN='))
        ?.slice('XSRF-TOKEN='.length);
    return cookie ? { 'X-XSRF-TOKEN': decodeURIComponent(cookie) } : {};
}

async function errorMessage(response: Response): Promise<string> {
    if (response.status === 419) return 'Your session expired. Refresh the page and try again.';
    if (response.status === 401 || response.status === 403) return 'You are not authorized to use the assistant.';

    try {
        const body: unknown = await response.json();
        if (isRecord(body) && typeof body.message === 'string') return body.message;
        if (isRecord(body) && isRecord(body.errors)) {
            const first = Object.values(body.errors).flat().find((value) => typeof value === 'string');
            if (typeof first === 'string') return first;
        }
    } catch {
        // Fall through to the status-based message when the server did not return JSON.
    }
    return `The assistant request failed (${response.status}). Please try again.`;
}

function WelcomeExperience({
    embedded,
    onQuestion,
}: {
    embedded: boolean;
    onQuestion: (question: string) => void;
}) {
    return (
        <div className={cn('pb-2 text-[#262626]', embedded ? 'space-y-4' : 'space-y-5 sm:space-y-6')}>
            <section className={cn(
                'relative overflow-hidden border border-[#F0D58F] bg-[#FFFBF2] shadow-[0_10px_30px_-24px_rgba(196,154,44,0.55)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300',
                embedded ? 'rounded-[18px] px-4 py-4' : 'rounded-[24px] px-5 py-6 sm:px-7 sm:py-7',
            )}>
                <svg
                    viewBox="0 0 520 220"
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-10 -right-12 h-[115%] w-[62%] text-[#E7C56D] opacity-20"
                >
                    <path d="M32 205c91-74 142-21 218-93 66-62 134-84 237-31" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M11 221c104-71 163-18 237-77 81-65 139-85 258-32" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="405" cy="20" r="94" fill="currentColor" opacity=".32" />
                </svg>
                <span className="pointer-events-none absolute right-8 top-8 text-xl text-[#D5A725]">✦</span>

                <div className={cn(
                    'relative z-10 grid items-center gap-5',
                    embedded
                        ? 'grid-cols-[5rem_minmax(0,1fr)] gap-4'
                        : 'grid-cols-1 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8',
                )}>
                    <div className={cn(
                        'relative mx-auto aspect-square overflow-hidden rounded-full border border-[#F0D58F] bg-[#FFDF8B] shadow-[0_14px_35px_-22px_rgba(154,113,10,0.6)]',
                        embedded ? 'w-20' : 'w-36 md:w-52',
                    )}>
                        <img
                            src={JADE_IMAGE}
                            alt="Jade, the clinic intelligence assistant"
                            draggable={false}
                            className="size-full object-contain"
                        />
                    </div>

                    <div className="min-w-0">
                        <h2 className={cn(
                            'font-bold tracking-[-0.035em] text-[#1F1F1F]',
                            embedded ? 'text-xl' : 'text-3xl sm:text-4xl',
                        )}>
                            Hello! I&apos;m <span className="text-[#B7860B]">Jade.</span>
                        </h2>
                        <p className={cn(
                            'mt-2 max-w-2xl font-normal leading-relaxed text-[#666675]',
                            embedded ? 'text-[11px] leading-4' : 'text-sm sm:text-lg',
                        )}>
                            Your clinic data, made easier to understand. What would you like to explore?
                        </p>
                        <div className={cn(
                            'flex items-center gap-2 font-medium text-[#8A6508]',
                            embedded ? 'mt-2.5 text-[9px]' : 'mt-4 text-xs sm:text-sm',
                        )}>
                            <ShieldCheck className="size-4 shrink-0" />
                            <span>Read-only access · Your records stay unchanged</span>
                        </div>
                    </div>
                </div>
            </section>

            <section aria-labelledby="explore-jade-heading">
                <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
                    <h2 id="explore-jade-heading" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373] sm:text-xs">
                        Explore your clinic
                    </h2>
                    <span className="hidden text-[10px] font-medium uppercase tracking-[0.12em] text-[#8A8A96] sm:block">
                        Suggested questions
                    </span>
                </div>

                <div className={cn('grid gap-3.5', embedded ? 'grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]' : 'grid-cols-1 md:grid-cols-2')}>
                    {INSIGHT_GROUPS.map((group, index) => {
                        const Icon = group.icon;
                        return (
                            <article
                                key={group.title}
                                className={cn(
                                    'group rounded-2xl border border-[#F0E3C6] bg-white shadow-[0_8px_25px_-24px_rgba(98,72,15,0.5)] transition duration-200 hover:border-[#DEC477] hover:bg-[#FFFBF2] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300',
                                    embedded ? 'p-3' : 'p-4 sm:p-5',
                                )}
                                style={{ animationDelay: `${70 + index * 55}ms`, animationFillMode: 'both' }}
                            >
                                <div className="flex items-start gap-3.5">
                                    <span className={cn('flex shrink-0 items-center justify-center rounded-xl bg-[#FFF5DE] text-[#AD7B00]', embedded ? 'size-9' : 'size-11 sm:size-12')}>
                                        <Icon className={cn(embedded ? 'size-4' : 'size-5 sm:size-6')} strokeWidth={2} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h3 className={cn('font-semibold text-[#262626]', embedded ? 'text-xs' : 'text-sm sm:text-base')}>{group.title}</h3>
                                        <p className={cn('mt-1 text-[#737373]', embedded ? 'text-[10px] leading-4' : 'text-xs leading-5 sm:text-[13px]')}>{group.description}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onQuestion(group.questions[0])}
                                        className={cn('flex shrink-0 items-center justify-center rounded-full bg-[#FFF5DE] text-[#9A710A] transition duration-200 hover:bg-[#FFDF8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2C]/40', embedded ? 'size-8' : 'size-9')}
                                        aria-label={`Ask about ${group.title.toLowerCase()}`}
                                    >
                                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                    </button>
                                </div>

                                <div className={cn('space-y-2 border-t border-[#F1E9D8]', embedded ? 'mt-3 pt-2.5' : 'mt-4 pt-3')}>
                                    {group.questions.map((question) => (
                                        <button
                                            key={question}
                                            type="button"
                                            onClick={() => onQuestion(question)}
                                            className={cn('flex w-full items-center justify-between gap-3 rounded-full border border-[#F0E3C6] bg-[#FFFBF2] text-left font-medium text-[#343434] transition duration-200 hover:border-[#D8B75B] hover:bg-[#FFF5DE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2C]/30', embedded ? 'px-3 py-2 text-[9px]' : 'px-4 py-2.5 text-[11px] sm:text-xs')}
                                        >
                                            <span>{question}</span>
                                            <ArrowRight className="size-3.5 shrink-0 text-[#A77800] transition-transform duration-200 group-hover:translate-x-0.5" />
                                        </button>
                                    ))}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

function AssistantChart({ block, embedded }: { block: ChartBlock; embedded: boolean }) {
    const config = Object.fromEntries(
        block.series.map((series, index) => [
            series.key,
            { label: series.label, color: series.color || CHART_COLORS[index % CHART_COLORS.length] },
        ]),
    ) satisfies ChartConfig;
    const primarySeries = block.series[0];
    const pieTotal = block.type === 'pie_chart'
        ? block.data.reduce((total, row) => total + Number(row[primarySeries.key] ?? 0), 0)
        : 0;

    return (
        <section className="min-w-0 rounded-2xl border border-[#F0E3C6] bg-white p-4 shadow-[0_8px_24px_-22px_rgba(75,54,8,0.45)] break-inside-avoid sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A97800]">Verified analytics</p>
                    <h3 className="mt-1 text-base font-semibold leading-tight">{block.title}</h3>
                </div>
                <span className="shrink-0 rounded-full bg-[#FFF5DE] px-2.5 py-1 text-[10px] font-medium text-[#7C6840]">
                    {block.type === 'line_chart' ? 'Trend' : block.type === 'bar_chart' ? 'Comparison' : 'Breakdown'}
                </span>
            </div>
            <ChartContainer
                config={config}
                className={cn(
                    'mx-auto w-full max-w-full',
                    block.type === 'pie_chart' && 'max-w-lg',
                    embedded ? 'h-48' : 'h-72',
                )}
            >
                {block.type === 'line_chart' ? (
                    <LineChart data={block.data} margin={{ left: -12, right: 12, top: 8 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey={block.xKey} tickLine={false} axisLine={false} minTickGap={28} />
                        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(value) => formatChartValue(Number(value), primarySeries.label)} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        {block.series.map((series) => (
                            <Line key={series.key} type="monotone" dataKey={series.key} stroke={`var(--color-${series.key})`} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                        ))}
                    </LineChart>
                ) : block.type === 'bar_chart' ? (
                    <BarChart data={block.data} margin={{ left: -12, right: 12, top: 8 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey={block.xKey} tickLine={false} axisLine={false} minTickGap={20} />
                        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(value) => formatChartValue(Number(value), primarySeries.label)} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        {block.series.map((series) => (
                            <Bar key={series.key} dataKey={series.key} fill={`var(--color-${series.key})`} radius={[6, 6, 0, 0]} maxBarSize={56} />
                        ))}
                    </BarChart>
                ) : (
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey={block.xKey} />} />
                        <Pie data={block.data} dataKey={primarySeries.key} nameKey={block.xKey} innerRadius="42%" outerRadius="76%" paddingAngle={2} strokeWidth={0}>
                            {block.data.map((_, index) => (
                                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                )}
            </ChartContainer>
            {block.type === 'pie_chart' && (
                <div className="mx-auto mt-3 grid max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                    {block.data.map((row, index) => {
                        const value = Number(row[primarySeries.key] ?? 0);
                        const percentage = pieTotal > 0 ? (value / pieTotal) * 100 : 0;
                        return (
                            <div key={`${String(row[block.xKey])}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                                <span className="flex min-w-0 items-center gap-2 font-medium">
                                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                    <span className="truncate">{String(row[block.xKey])}</span>
                                </span>
                                <span className="shrink-0 tabular-nums text-muted-foreground">
                                    {formatChartValue(value, primarySeries.label)} · {percentage.toFixed(1)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function AssistantBlockView({ block, embedded }: { block: AssistantBlock; embedded: boolean }) {
    if (block.type === 'line_chart' || block.type === 'bar_chart' || block.type === 'pie_chart') {
        return <AssistantChart block={block} embedded={embedded} />;
    }

    if (block.type === 'kpi_grid') {
        return (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3 break-inside-avoid">
                {block.items.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="min-w-0 rounded-2xl border border-[#F0E3C6] bg-white p-4 shadow-[0_8px_24px_-22px_rgba(75,54,8,0.45)]">
                        <div className="text-xs font-medium leading-5 text-[#737373]">{item.label}</div>
                        <div className="mt-1.5 break-words text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{item.value}</div>
                        {item.detail && <div className="mt-1.5 text-xs leading-5 text-[#737373]">{item.detail}</div>}
                    </div>
                ))}
            </div>
        );
    }

    if (block.type === 'table') {
        return (
            <section className="min-w-0 overflow-hidden rounded-2xl border border-[#F0E3C6] bg-white shadow-[0_8px_24px_-22px_rgba(75,54,8,0.45)] break-inside-avoid">
                <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
                    <h3 className="text-base font-semibold leading-tight">{block.title}</h3>
                    <span className="shrink-0 rounded-full bg-[#FFF5DE] px-2.5 py-1 text-[10px] font-medium text-[#7C6840]">
                        {block.rows.length} {block.rows.length === 1 ? 'row' : 'rows'}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left text-sm">
                        <thead className="border-y border-[#F0E3C6] bg-[#FFFBF2] text-xs text-[#737373]">
                            <tr>
                                {block.columns.map((column) => (
                                    <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold sm:px-5">{column.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1E9D8]">
                            {block.rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="transition-colors print:hover:bg-transparent hover:bg-[#FFFBF2]">
                                    {block.columns.map((column) => (
                                        <td key={column.key} className="whitespace-nowrap px-4 py-3 tabular-nums sm:px-5">
                                            {formatTableValue(row[column.key] ?? null, column.key)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        );
    }

    if (block.type === 'recommendations') {
        return (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-3 break-inside-avoid">
                {block.items.map((item, index) => {
                    const severity = item.severity?.toLowerCase();
                    const severityClass = severity === 'high'
                        ? 'border-destructive/30 bg-destructive/10 text-destructive'
                        : severity === 'opportunity'
                            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400';
                    return (
                        <article key={`${item.title}-${index}`} className="rounded-2xl border border-[#F0E3C6] bg-white p-4 shadow-[0_8px_24px_-22px_rgba(75,54,8,0.45)] sm:p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF5DE] text-[#A97800]">
                                    {severity === 'opportunity' ? <Sparkles className="size-4" /> : <AlertTriangle className="size-4" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <h3 className="text-sm font-semibold leading-5">{item.title}</h3>
                                        {item.severity && <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', severityClass)}>{item.severity}</span>}
                                    </div>
                                    <p className="mt-1.5 text-xs leading-5 text-[#737373]">{item.reason}</p>
                                    {item.action && (
                                        <div className="mt-3 rounded-lg bg-[#FFFBF2] px-3 py-2 text-xs font-medium leading-5">
                                            Next: {item.action}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        );
    }

    return null;
}

function AssistantReport({ response, embedded }: { response: AssistantResponse; embedded: boolean }) {
    if (response.blocks.length === 0) return null;

    return (
        <section className="min-w-0 space-y-4 print:space-y-3" aria-label="Verified analytics report">
            <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#262626]">Verified results</span>
                <span className="h-px flex-1 bg-[#F0E3C6]" />
                <span className="text-[10px] text-[#737373]">Source-grounded</span>
            </div>
            <div className="grid min-w-0 gap-4">
                {response.blocks.map((block, index) => (
                    <AssistantBlockView key={index} block={block} embedded={embedded} />
                ))}
            </div>
        </section>
    );
}

function AssistantMessage({ message, embedded }: { message: ChatMessage; embedded: boolean }) {
    const response = message.response;

    return (
        <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-3">
            <div className="mt-0.5 size-8 overflow-hidden rounded-full border border-[#F0D58F] bg-[#FFF5DE] print:hidden">
                <img src={JADE_IMAGE} alt="Jade" draggable={false} className="size-full object-cover" />
            </div>
            <div className="min-w-0 space-y-4">
                <div className="typeset-docs w-fit max-w-[94%] rounded-2xl rounded-tl-md border border-[#F0E3C6] bg-[#FFFBF2] px-4 py-3 text-[#262626] [--typeset-size:14px] sm:px-5 sm:py-3.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
                {response && <AssistantReport response={response} embedded={embedded} />}
                {response && response.warnings.length > 0 && (
                    <div className="grid gap-2">
                        {response.warnings.map((warning, index) => (
                            <div key={index} className="flex gap-2.5 rounded-xl border border-[#E8CB7D] bg-[#FFF8E8] px-3 py-2.5 text-xs leading-5">
                                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                                <span>{warning}</span>
                            </div>
                        ))}
                    </div>
                )}
                {response && (response.citations.length > 0 || response.asOf) && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-[#F0E3C6] pt-3 text-[11px] text-[#737373]">
                        {response.asOf && <span>Last synced {response.asOf}</span>}
                        {response.citations.map((citation) => (
                            <span key={citation.id} title={[citation.tool, citation.as_of].filter(Boolean).join(' · ')} className="rounded-full border border-[#F0E3C6] bg-[#FFFBF2] px-2.5 py-1 font-medium">
                                {citation.label || citation.id}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function AiAssistantChat({ embedded = false, fill = false }: AiAssistantChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [failedRequest, setFailedRequest] = useState<{ prompt: string; history: ChatMessage[] } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const composerRef = useRef<HTMLTextAreaElement>(null);
    const controllerRef = useRef<AbortController | null>(null);

    useEffect(() => () => controllerRef.current?.abort(), []);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isLoading, error]);
    useEffect(() => {
        const composer = composerRef.current;
        if (!composer) return;
        composer.style.height = 'auto';
        composer.style.height = `${Math.min(composer.scrollHeight, 112)}px`;
    }, [input]);

    const sendMessage = async (prompt: string, history: ChatMessage[], appendUser = true) => {
        const text = prompt.trim();
        if (!text || isLoading) return;

        if (appendUser) setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: text }]);
        setInput('');
        setError(null);
        setFailedRequest(null);
        setIsLoading(true);
        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            const response = await fetch(route('assistant.message'), {
                method: 'POST',
                credentials: 'same-origin',
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                },
                body: JSON.stringify({
                    message: text,
                    history: history.slice(-12).map(({ role, content }) => ({ role, content })),
                }),
            });
            if (!response.ok) throw new Error(await errorMessage(response));
            const assistantResponse = parseResponse(await response.json());
            setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: assistantResponse.answer, response: assistantResponse }]);
        } catch (requestError) {
            if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
            setError(requestError instanceof Error ? requestError.message : 'Jade could not complete the request. Please try again.');
            setFailedRequest({ prompt: text, history });
        } finally {
            if (controllerRef.current === controller) {
                controllerRef.current = null;
                setIsLoading(false);
            }
        }
    };

    const handleSend = (event: React.FormEvent) => {
        event.preventDefault();
        void sendMessage(input, messages);
    };
    const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (input.trim() && !isLoading) void sendMessage(input, messages);
        }
    };
    const latestResponse = [...messages].reverse().find((message) => message.response)?.response;
    const suggestions = latestResponse?.suggestions ?? [];

    return (
        <div className={cn(
            'jade-assistant flex flex-col gap-3 text-[#262626] print:h-auto',
            fill ? 'h-full min-h-0' : embedded ? 'h-80' : 'h-[72dvh] min-h-[32rem] max-h-[58rem]',
        )}>
            <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pr-1 print:overflow-visible">
                {messages.length === 0 && <WelcomeExperience embedded={embedded} onQuestion={(question) => void sendMessage(question, messages)} />}
                {messages.map((message) => message.role === 'user' ? (
                    <div key={message.id} className="flex justify-end break-inside-avoid motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
                        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-[#EBCF86] bg-[#FFF5DE] px-4 py-3 text-sm font-medium leading-6 text-[#493706] shadow-[0_7px_18px_-16px_rgba(90,64,0,0.65)]">{message.content}</div>
                    </div>
                ) : <AssistantMessage key={message.id} message={message} embedded={embedded} />)}
                {isLoading && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-[#F0E3C6] bg-[#FFFBF2] px-3 py-2.5 text-sm text-[#737373] shadow-sm print:hidden">
                        <span className="size-4 animate-spin rounded-full border-2 border-[#E8D7B2] border-t-[#C49A2C] motion-reduce:animate-none" />
                        Analyzing your data and checking available tools…
                    </div>
                )}
                {error && (
                    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        <p>{error}</p>
                        {failedRequest && <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void sendMessage(failedRequest.prompt, failedRequest.history, false)}><RefreshCw className="size-3.5" />Retry</Button>}
                    </div>
                )}
                {messages.length > 0 && suggestions.length > 0 && !isLoading && (
                    <div className="flex flex-wrap gap-2 print:hidden">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => void sendMessage(suggestion, messages)}
                                className="rounded-full border border-[#F0E3C6] bg-[#FFFBF2] px-3 py-1.5 text-xs font-medium text-[#4B4B4B] transition duration-200 hover:border-[#D6B458] hover:bg-[#FFF5DE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2C]/30"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <form
                onSubmit={handleSend}
                className="flex shrink-0 items-end gap-2 rounded-[20px] border border-[#E5E5E5] bg-white p-2 shadow-[0_10px_30px_-20px_rgba(38,38,38,0.4)] transition duration-200 focus-within:border-[#D8B75B] focus-within:shadow-[0_12px_34px_-20px_rgba(196,154,44,0.5)] print:hidden"
            >
                <textarea
                    ref={composerRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Ask Jade about sales, staff, suppliers, or inventory..."
                    rows={1}
                    disabled={isLoading}
                    className="min-h-11 max-h-28 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm leading-6 text-[#262626] shadow-none outline-none placeholder:text-[#92929E] focus:border-0 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {isLoading ? (
                    <Button type="button" size="icon" variant="outline" className="size-11 shrink-0 rounded-full border-[#F0E3C6]" onClick={() => controllerRef.current?.abort()} aria-label="Stop request"><Square className="size-3.5 fill-current" /></Button>
                ) : (
                    <Button
                        type="submit"
                        size="icon"
                        className="size-11 shrink-0 rounded-full bg-[#FFDF8B] text-[#8A6508] shadow-none transition duration-150 hover:scale-[1.03] hover:bg-[#F7CE62] active:scale-95 disabled:bg-[#F6F1E7] disabled:text-[#B8B3A8]"
                        disabled={!input.trim()}
                        aria-label="Send message"
                    >
                        <ArrowUp className="size-5" strokeWidth={2.25} />
                    </Button>
                )}
            </form>
        </div>
    );
}

export default AiAssistantChat;
