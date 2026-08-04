import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface User {
    id: number;
    email: string;
    name: string | null;
    user_metadata: Record<string | unknown>;
}

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps {
        auth: {
            user: User | null;
        };
    }
}
