import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import AppSidebar from '@/Layouts/AppSidebar';
import SyncBadge from '@/components/dashboard/SyncBadge';
import { Bell, Search } from 'lucide-react';
import { useState, type PropsWithChildren, type ReactNode } from 'react';

function getCookie(name: string): string | undefined {
    const match = document.cookie.match(
        new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'),
    );
    return match ? decodeURIComponent(match[1]) : undefined;
}

type SidebarLayoutProps = PropsWithChildren<{
    title: string;
    subtitle?: string;
    dateRange?: ReactNode;
}>;

function TopNav({ title, subtitle, dateRange }: Omit<SidebarLayoutProps, 'children'>) {
    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="lg:hidden" />
                <div className="flex min-w-0 flex-col">
                    <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
                    {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
                </div>
            </div>

            <div className="mx-auto hidden w-full max-w-md items-center md:flex">
                <div className="relative w-full">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search…"
                        className="h-9 rounded-full bg-muted/60 pl-9 shadow-none"
                    />
                </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
                <SyncBadge />
                {dateRange}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="relative inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                            <Bell className="size-[18px]" />
                            <span className="absolute right-2 top-2 size-2 rounded-full bg-gold ring-2 ring-background" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Notifications</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No new notifications
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

function SidebarLayout({ title, subtitle, dateRange, children }: SidebarLayoutProps) {
    const [defaultOpen] = useState(() => {
        const cookie = getCookie('sidebar_state');
        return cookie === undefined ? false : cookie === 'true';
    });

    return (
        <SidebarProvider
            defaultOpen={defaultOpen}
            style={{ '--sidebar-width': '15.625rem' } as React.CSSProperties}
        >
            <AppSidebar />
            <SidebarInset>
                <TopNav title={title} subtitle={subtitle} dateRange={dateRange} />
                <div className="flex flex-1 flex-col gap-6 p-8">{children}</div>
            </SidebarInset>
            <Toaster richColors position="bottom-right" />
        </SidebarProvider>
    );
}

export default SidebarLayout;
