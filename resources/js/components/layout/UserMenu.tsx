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
import { LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

function UserMenu() {
    const user = usePage().props.auth.user;
    const [logoutOpen, setLogoutOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Account"
                    >
                        <Avatar className="size-8">
                            <AvatarFallback className="bg-gold text-xs text-gold-foreground">
                                {initials(user?.name ?? user?.email)}
                            </AvatarFallback>
                        </Avatar>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-lg" sideOffset={6}>
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
        </>
    );
}

export default UserMenu;
