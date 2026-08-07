import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { initials } from '@/lib/format';
import { Link, usePage } from '@inertiajs/react';
import {
    Boxes,
    ChevronsUpDown,
    LayoutDashboard,
    LogOut,
    Package,
    Settings,
    ShoppingCart,
    Sparkles,
    Truck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

const navGroups = [
    {
        label: 'Overview',
        items: [{ label: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, current: () => route().current('dashboard') }],
    },
    {
        label: 'Management',
        items: [
            { label: 'Sales', href: route('sales'), icon: ShoppingCart, current: () => route().current('sales') },
            { label: 'Products', href: route('products'), icon: Package, current: () => route().current('products') },
            { label: 'Inventory', href: route('inventory'), icon: Boxes, current: () => route().current('inventory') },
            { label: 'Suppliers', href: route('suppliers'), icon: Truck, current: () => route().current('suppliers') },
        ],
    },
    {
        label: 'Team',
        items: [
            { label: 'Staff', href: route('staff'), icon: Users, current: () => route().current('staff') },
            { label: 'AI Assistant', href: route('assistant'), icon: Sparkles, current: () => route().current('assistant') },
        ],
    },
] as const;

function AppSidebar() {
    const { toggleSidebar, isMobile } = useSidebar();
    const user = usePage().props.auth.user;
    const [logoutOpen, setLogoutOpen] = useState(false);

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        {isMobile ? (
                            <SidebarMenuButton asChild size="lg">
                                <button type="button" onClick={toggleSidebar} className="cursor-pointer">
                                    <img
                                        src="/images/logo.png"
                                        alt="Jade Clinic"
                                        className="size-8 shrink-0 rounded-lg object-contain"
                                    />
                                    <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                                        <span className="font-semibold">Jade Clinic</span>
                                        <span className="text-xs text-muted-foreground">Admin Dashboard</span>
                                    </div>
                                </button>
                            </SidebarMenuButton>
                        ) : (
                            <Tooltip>
                                <SidebarMenuButton asChild size="lg">
                                    <TooltipTrigger asChild>
                                        <button type="button" onClick={toggleSidebar} className="cursor-pointer">
                                            <img
                                                src="/images/logo.png"
                                                alt="Jade Clinic"
                                                className="size-8 shrink-0 rounded-lg object-contain"
                                            />
                                            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                                                <span className="font-semibold">Jade Clinic</span>
                                                <span className="text-xs text-muted-foreground">Admin Dashboard</span>
                                            </div>
                                        </button>
                                    </TooltipTrigger>
                                </SidebarMenuButton>
                                <TooltipContent side="right" align="center">
                                    Toggle sidebar
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {navGroups.map((group) => (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={item.current()}
                                            tooltip={item.label}
                                        >
                                            <Link href={item.href}>
                                                <item.icon />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <SidebarMenuButton
                                asChild
                                size="lg"
                                className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <DropdownMenuTrigger asChild>
                                    <button type="button" className="w-full text-left">
                                        <Avatar className="size-8 shrink-0">
                                            <AvatarFallback className="bg-gold text-gold-foreground">
                                                {initials(user?.name ?? user?.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                                            <span className="truncate text-sm font-medium">
                                                {user?.name ?? 'Clinic User'}
                                            </span>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {user?.email}
                                            </span>
                                        </div>
                                        <ChevronsUpDown className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
                                    </button>
                                </DropdownMenuTrigger>
                            </SidebarMenuButton>
                            <DropdownMenuContent
                                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
                                side={isMobile ? 'bottom' : 'right'}
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="size-8 shrink-0">
                                            <AvatarFallback className="bg-gold text-gold-foreground">
                                                {initials(user?.name ?? user?.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid min-w-0 flex-1 text-left leading-tight">
                                            <span className="truncate text-sm font-medium">
                                                {user?.name ?? 'Clinic User'}
                                            </span>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {user?.email}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={route('settings')}>
                                        <Settings />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setLogoutOpen(true)}
                                >
                                    <LogOut />
                                    Log Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>

                <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                    <DialogContent showCloseButton={false} className="sm:max-w-sm py-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <LogOut className="size-5" />
                            </div>
                            <DialogHeader className="items-center text-center">
                                <DialogTitle>Log out of Jade Clinic?</DialogTitle>
                                <DialogDescription>
                                    You'll need to sign in again to access the dashboard.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <DialogFooter className="sm:justify-center">
                            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-destructive text-white hover:bg-destructive/90"
                                asChild
                            >
                                <Link href={route('logout')} method="post" as="button">
                                    Log out
                                </Link>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SidebarFooter>
        </Sidebar>
    );
}

export default AppSidebar;
