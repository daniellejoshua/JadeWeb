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
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { Link } from '@inertiajs/react';
import {
    Boxes,
    Gem,
    LayoutDashboard,
    LogOut,
    Package,
    Settings,
    ShoppingCart,
    Sparkles,
    Truck,
    Users,
} from 'lucide-react';
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
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild size="lg">
                            <Link href={route('dashboard')}>
                                <div className="flex size-8 items-center justify-center rounded-lg bg-jade text-jade-foreground">
                                    <Gem className="size-4" />
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="font-semibold">Jade Clinic</span>
                                    <span className="text-xs text-muted-foreground">Admin Dashboard</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
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
                        <SidebarMenuButton asChild tooltip="Settings">
                            <Link href={route('settings')}>
                                <Settings />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarSeparator />
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Log Out"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Link href={route('logout')} method="post" as="button">
                                <LogOut />
                                <span>Log Out</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

export default AppSidebar;
