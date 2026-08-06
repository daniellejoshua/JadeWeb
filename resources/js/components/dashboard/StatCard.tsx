import DashboardCard from '@/components/dashboard/DashboardCard';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type StatCardProps = {
    label: string;
    value: ReactNode;
    sub?: ReactNode;
    icon: LucideIcon;
    iconClassName?: string;
    tooltip?: ReactNode;
};

function StatCard({ label, value, sub, icon: Icon, iconClassName, tooltip }: StatCardProps) {
    const [showFull, setShowFull] = useState(false);
    useEffect(() => {
        setShowFull(false);
    }, [value]);
    const display = tooltip && showFull ? tooltip : value;

    const valueNode = (
        <span className="break-words text-2xl font-semibold leading-snug tracking-tight tabular-nums min-[480px]:text-lg min-[1536px]:text-xl">
            {display}
        </span>
    );

    return (
        <DashboardCard className="p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    {tooltip ? (
                        <button
                            type="button"
                            onClick={() => setShowFull((full) => !full)}
                            className="cursor-pointer justify-start text-left"
                            title={showFull ? 'Show compact value' : 'Click for exact value'}
                        >
                            {valueNode}
                        </button>
                    ) : (
                        valueNode
                    )}
                    {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
                </div>
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-strong',
                        iconClassName,
                    )}
                >
                    <Icon className="size-5" />
                </div>
            </div>
        </DashboardCard>
    );
}

export default StatCard;
