import DashboardCard from '@/components/dashboard/DashboardCard';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type StatCardProps = {
    label: string;
    value: ReactNode;
    sub?: ReactNode;
    icon: LucideIcon;
    iconClassName?: string;
};

function StatCard({ label, value, sub, icon: Icon, iconClassName }: StatCardProps) {
    return (
        <DashboardCard className="p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="truncate text-2xl font-semibold tracking-tight">{value}</span>
                    {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
                </div>
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-jade-soft text-jade',
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
