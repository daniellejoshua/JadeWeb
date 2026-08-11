import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';
import { RefreshCw } from 'lucide-react';

function SyncBadge() {
    const { sync } = usePage<PageProps>().props;
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge
                    variant="outline"
                    className="hidden h-7 gap-1.5 rounded-full border-border/60 text-muted-foreground sm:inline-flex"
                >
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-60" />
                        <span className="relative inline-flex size-2 rounded-full bg-gold" />
                    </span>
                    <RefreshCw className="size-3" />
                    {sync.label}
                </Badge>
            </TooltipTrigger>
            <TooltipContent>{sync.detail}</TooltipContent>
        </Tooltip>
    );
}

export default SyncBadge;
