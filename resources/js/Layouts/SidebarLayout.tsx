import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
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
import MobileNav from '@/components/layout/MobileNav';
import UserMenu from '@/components/layout/UserMenu';
import SyncBadge from '@/components/dashboard/SyncBadge';
import { Bell, Search } from 'lucide-react';
import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';

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

function BellMenu() {
    return (
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
    );
}

function TopNav({
    title,
    subtitle,
    dateRange,
    searchOpen,
}: Omit<SidebarLayoutProps, 'children'> & { searchOpen: boolean }) {
    const { openMobile } = useSidebar();

    return (
        <>
            <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 supports-[backdrop-filter]:md:bg-background/60 md:h-16 md:gap-4 md:px-6 md:bg-background/95 md:backdrop-blur">
                {openMobile && (
                    <div
                        className="absolute inset-0 z-10 bg-background/60 backdrop-blur-md"
                        aria-hidden="true"
                    />
                )}
                <div className="flex min-w-0 items-center">
                    <div className="flex min-w-0 flex-col">
                        <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
                        {subtitle && <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>}
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

                <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 md:ml-0">
                    <div className="hidden items-center gap-1.5 sm:gap-2 md:flex">
                        <SyncBadge />
                        {dateRange && <div className="hidden md:block">{dateRange}</div>}
                        <BellMenu />
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 md:hidden">
                        <SyncBadge />
                        {dateRange && (
                            <div className="[&_[data-slot='select-trigger']]:max-sm:w-[116px]">{dateRange}</div>
                        )}
                        <UserMenu />
                        <SidebarTrigger />
                    </div>
                </div>
            </header>

            {searchOpen && (
                <div className="sticky top-14 z-20 border-b bg-background px-4 py-2 md:hidden">
                    <div className="relative w-full">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search…"
                            autoFocus
                            className="h-9 rounded-full bg-muted/60 pl-9 shadow-none"
                        />
                    </div>
                </div>
            )}
        </>
    );
}

function SidebarShell({ title, subtitle, dateRange, children }: SidebarLayoutProps) {
    const { isMobile, openMobile, setOpenMobile } = useSidebar();
    const [searchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        if (openMobile) setSearchOpen(false);
    }, [openMobile]);

    return (
        <>
            {!isMobile && <AppSidebar />}
            <SidebarInset>
                <TopNav
                    title={title}
                    subtitle={subtitle}
                    dateRange={dateRange}
                    searchOpen={searchOpen}
                />
                <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-8">{children}</div>
            </SidebarInset>
            <MobileNav
                open={openMobile}
                onClose={() => setOpenMobile(false)}
                onSearch={() => {
                    setOpenMobile(false);
                    setSearchOpen(true);
                }}
            />
            <Toaster richColors position="bottom-right" />
        </>
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
            <SidebarShell title={title} subtitle={subtitle} dateRange={dateRange}>
                {children}
            </SidebarShell>
        </SidebarProvider>
    );
}

export default SidebarLayout;
