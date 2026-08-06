import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

function DashboardCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <Card
            className={cn(
                'rounded-[20px] border-none shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.06)]',
                className,
            )}
            {...props}
        />
    );
}

export default DashboardCard;
