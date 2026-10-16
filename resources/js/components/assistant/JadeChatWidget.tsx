import { Button } from '@/components/ui/button';
import JadeAvatar, { type JadeRobotState } from '@/components/assistant/JadeAvatar';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, ChevronDown, LoaderCircle, MessageSquarePlus } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { route } from 'ziggy-js';

const AiAssistantChat = lazy(() => import('@/components/assistant/AiAssistantChat'));

function JadeChatWidget() {
    const [open, setOpen] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);
    const [robotState, setRobotState] = useState<JadeRobotState>('idle');
    const [resetToken, setResetToken] = useState(0);

    if (route().current('assistant')) return null;

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) setHasOpened(true);
    };

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <button
                    type="button"
                    aria-label="Open chat with Jade"
                    className="jade-assistant group fixed bottom-5 right-4 z-40 flex h-14 items-center gap-3 rounded-full border border-[#F0E3C6] bg-white p-1.5 pr-2 shadow-[0_12px_35px_-15px_rgba(67,50,10,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-[#D8B75B] hover:bg-[#FFFBF2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2C]/40 print:hidden sm:bottom-6 sm:right-6 sm:pr-5"
                >
                    <JadeAvatar size={44} state={robotState} paused={open} label="" />
                    <span className="hidden text-left leading-tight sm:block">
                        <span className="block text-sm font-semibold text-[#262626]">Chat with Jade</span>
                        <span className="flex items-center gap-1.5 text-[11px] text-[#737373]">
                            <span className="size-1.5 rounded-full bg-[#16A34A]" />
                            Online
                        </span>
                    </span>
                </button>
            </SheetTrigger>

            <SheetContent
                side="right"
                showCloseButton={false}
                className="jade-assistant !inset-x-0 !bottom-0 !top-auto !h-[100dvh] !w-full !max-w-none gap-0 overflow-hidden rounded-none border-0 bg-white p-0 text-[#262626] shadow-[0_24px_70px_-24px_rgba(38,38,38,0.3)] print:hidden sm:!inset-x-auto sm:!bottom-6 sm:!right-6 sm:!top-auto sm:!h-[min(39rem,calc(100dvh-3rem))] sm:!w-[34rem] sm:!max-w-[calc(100vw-3rem)] sm:rounded-[22px] sm:border sm:border-[#F0E3C6]"
            >
                <SheetHeader className="shrink-0 flex-row items-center gap-2.5 border-b border-[#F0E3C6] bg-white px-4 py-3 text-left">
                    <JadeAvatar size={40} state={robotState} label={`Jade AI, ${robotState}`} />
                    <div className="min-w-0 flex-1">
                        <SheetTitle className="flex items-center gap-2 text-sm font-semibold text-[#262626]">
                            Jade AI
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF8EF] px-2 py-0.5 text-[10px] font-medium text-[#16803A]">
                                <span className="size-1.5 rounded-full bg-[#16A34A]" />
                                Online
                            </span>
                        </SheetTitle>
                        <SheetDescription className="truncate text-xs text-[#737373]">
                            Clinic intelligence assistant
                        </SheetDescription>
                    </div>
                    <Link
                        href={route('assistant')}
                        className="hidden items-center gap-1 text-xs font-medium text-[#A97800] transition hover:text-[#7D5900] sm:inline-flex"
                    >
                        Full view
                        <ArrowUpRight className="size-3.5" />
                    </Link>
                    <span className="hidden h-6 w-px bg-[#EEE4D1] sm:block" aria-hidden="true" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-[#8A6508] hover:bg-[#FFF5DE]"
                        onClick={() => setResetToken((token) => token + 1)}
                        aria-label="Start a new chat"
                        title="New chat"
                    >
                        <MessageSquarePlus className="size-4" />
                    </Button>
                    <SheetClose asChild>
                        <Button type="button" variant="ghost" size="icon-sm" className="text-[#262626] hover:bg-[#FFF5DE]" aria-label="Minimize chat">
                            <ChevronDown className="size-4" />
                        </Button>
                    </SheetClose>
                </SheetHeader>

                <div className="min-h-0 flex-1 bg-white p-3">
                    {hasOpened && (
                        <Suspense
                            fallback={(
                                <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    Loading Jade…
                                </div>
                            )}
                        >
                            <AiAssistantChat embedded fill onRobotStateChange={setRobotState} resetToken={resetToken} />
                        </Suspense>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default JadeChatWidget;
