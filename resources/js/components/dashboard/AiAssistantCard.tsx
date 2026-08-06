import DashboardCard from '@/components/dashboard/DashboardCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import AiAssistantChat from '@/components/assistant/AiAssistantChat';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

function AiAssistantCard() {
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <DashboardCard className="relative overflow-hidden">
            <Badge
                variant="outline"
                className="absolute right-4 top-4 gap-1.5 rounded-full border-border/60 font-normal text-muted-foreground"
            >
                <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-gold" />
                </span>
                Online
            </Badge>

            {!chatOpen ? (
                <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                    <div className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-gold/30 to-gold/10 text-gold-strong">
                        <Sparkles className="size-8" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-lg font-semibold tracking-tight">Meet Jade</span>
                        <span className="max-w-[260px] text-sm text-muted-foreground">
                            Your AI clinic assistant. Ask about sales, inventory, products, or staff —
                            instantly.
                        </span>
                    </div>
                    <div className="mt-1 flex flex-col items-center gap-2">
                        <Button
                            className="h-10 rounded-full bg-gold px-6 text-gold-foreground hover:bg-gold/90"
                            onClick={() => setChatOpen(true)}
                        >
                            <Sparkles className="size-4" />
                            Chat with Jade
                        </Button>
                        <Link
                            href={route('assistant')}
                            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                            Open in full view
                            <ArrowUpRight className="size-3.5" />
                        </Link>
                    </div>
                </CardContent>
            ) : (
                <CardContent className="flex flex-col gap-3 pt-6">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-gold-soft text-gold-strong">
                                <Sparkles className="size-4" />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-sm font-medium">Chat with Jade</span>
                                <span className="text-xs text-muted-foreground">AI Assistant</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={route('assistant')}
                                className="inline-flex items-center gap-1 text-xs font-medium text-gold-strong hover:underline"
                            >
                                Full view
                                <ArrowUpRight className="size-3.5" />
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setChatOpen(false)}
                                aria-label="Close chat"
                            >
                                <ChevronDown className="size-4" />
                            </Button>
                        </div>
                    </div>
                    <AiAssistantChat embedded />
                </CardContent>
            )}
        </DashboardCard>
    );
}

export default AiAssistantCard;
