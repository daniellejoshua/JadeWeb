import { Badge } from '@/components/ui/badge';
import { syncStatus } from '@/data/mock';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw } from 'lucide-react';

function SyncBadge() {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge
                    variant="outline"
                    className="hidden h-7 gap-1.5 rounded-full border-border/60 text-muted-foreground sm:inline-flex"
                >
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-jade opacity-60" />
                        <span className="relative inline-flex size-2 rounded-full bg-jade" />
                    </span>
                    <RefreshCw className="size-3" />
                    {syncStatus.label}
                </Badge>
            </TooltipTrigger>
            <TooltipContent>{syncStatus.detail}</TooltipContent>
        </Tooltip>
    );
}

export default SyncBadge;
