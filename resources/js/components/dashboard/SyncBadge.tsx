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
                    className="inline-flex h-7 gap-1.5 rounded-full border-border/60 text-muted-foreground"
                >
                    <span className="size-2 rounded-full bg-gold" />
                    <RefreshCw className="size-3" />
                    <span className="hidden sm:inline">{sync.label}</span>
                </Badge>
            </TooltipTrigger>
            <TooltipContent>{sync.detail}</TooltipContent>
        </Tooltip>
    );
}

export default SyncBadge;
