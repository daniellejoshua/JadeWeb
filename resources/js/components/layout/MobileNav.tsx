import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { navGroups } from '@/Layouts/AppSidebar';
import { cn } from '@/lib/utils';

const OPEN_EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
const CLOSE_EASE = 'cubic-bezier(0.55, 0.06, 0.68, 0.19)';

type MobileNavProps = {
    open: boolean;
    onClose: () => void;
    onSearch: () => void;
};

const rowClass = (active: boolean) =>
    cn(
        'flex h-12 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors',
        active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
    );

function MobileNav({ open, onClose, onSearch }: MobileNavProps) {
    const [view, setView] = useState<'top' | 'section'>('top');
    const [sectionKey, setSectionKey] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setView('top');
            setSectionKey(null);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        return router.on('start', onClose);
    }, [open, onClose]);

    const section = sectionKey ? navGroups.find((group) => group.label === sectionKey) : undefined;

    return (
        <div
            className="fixed inset-x-0 bottom-0 top-14 z-30 md:hidden"
            style={{
                visibility: open ? 'visible' : 'hidden',
                transition: open ? 'visibility 0s 0s' : 'visibility 0s 150ms',
            }}
        >
            <div
                className="absolute left-1/2 top-5 z-40 -translate-x-1/2"
                style={{
                    visibility: open ? 'visible' : 'hidden',
                    transition: open ? 'visibility 0s 0s' : 'visibility 0s 150ms',
                }}
            >
                <div
                    className="flex items-center gap-1.5 rounded-full border border-border/60 bg-sidebar/90 px-1.5 py-1.5 shadow-xl backdrop-blur-md"
                    style={{
                        opacity: open ? 1 : 0,
                        transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
                        transition: `opacity ${open ? 200 : 100}ms ease, transform ${open ? 200 : 150}ms ${open ? OPEN_EASE : CLOSE_EASE}`,
                    }}
                >
                    <button
                        type="button"
                        aria-label="Search"
                        onClick={onSearch}
                        className="inline-flex size-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                        <Search className="size-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={onClose}
                        className="inline-flex size-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>

            <div
                className="absolute inset-0 bg-background/25 backdrop-blur-md"
                onClick={onClose}
                style={{
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                    transition: `opacity ${open ? 200 : 100}ms ease`,
                }}
            />
            <div
                className="absolute inset-x-0 bottom-0 flex max-h-full flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border/60 bg-sidebar text-sidebar-foreground shadow-xl"
                style={{
                    transform: open ? 'translateY(0)' : 'translateY(100%)',
                    transition: `transform ${open ? 300 : 150}ms ${open ? OPEN_EASE : CLOSE_EASE}`,
                }}
            >
                {view === 'section' && section && (
                    <div className="flex h-12 shrink-0 items-center border-b border-border/60">
                        <button
                            type="button"
                            onClick={() => {
                                setView('top');
                                setSectionKey(null);
                            }}
                            className="inline-flex h-full w-full items-center gap-1 px-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent"
                        >
                            <ChevronLeft className="size-5 shrink-0" />
                            <span className="truncate">{section.label}</span>
                        </button>
                    </div>
                )}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
                    {view === 'top' ? (
                        <nav aria-label="Mobile menu">
                            {navGroups.map((group, index) => {
                                const Icon = group.items[0].icon;
                                const direct = group.items.length === 1 ? group.items[0] : undefined;
                                const active = group.items.some((item) => item.current());
                                return (
                                    <div key={group.label}>
                                        {index > 0 && (
                                            <div className="mx-2 my-2 h-px bg-sidebar-border" />
                                        )}
                                        {direct ? (
                                            <Link
                                                href={direct.href}
                                                onClick={onClose}
                                                className={rowClass(direct.current())}
                                            >
                                                <Icon className="size-5 shrink-0" />
                                                <span className="truncate">{group.label}</span>
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setView('section');
                                                    setSectionKey(group.label);
                                                }}
                                                className={rowClass(active)}
                                            >
                                                <Icon className="size-5 shrink-0" />
                                                <span className="truncate">{group.label}</span>
                                                <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                    ) : (
                        section && (
                            <nav aria-label={`${section.label} menu`}>
                                {section.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className={rowClass(item.current())}
                                    >
                                        <item.icon className="size-5 shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                ))}
                            </nav>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default MobileNav;
