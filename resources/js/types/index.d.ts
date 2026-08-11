import { PageProps as InertiaPageProps } from '@inertiajs/core';
import type {
    InventoryStatus,
    PeriodData,
    PeriodKey,
    SyncStatus,
    TopProduct,
} from './dashboard';

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps {
        auth: {
            user: User | null;
        };
        sync: SyncStatus;
        periods?: Record<PeriodKey, PeriodData>;
        topProducts?: TopProduct[];
        inventoryStatus?: InventoryStatus;
        inventoryValue?: number;
        productCount?: number;
    }
}
interface User {
    id: string;
    email: string;
    name: string | null;
    user_metadata: Record<string, unknown>;
}

