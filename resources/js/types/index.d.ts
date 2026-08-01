import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
}

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps {
        auth: {
            user: User | null;
        };
    }
}
