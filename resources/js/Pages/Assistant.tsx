import SidebarLayout from '@/Layouts/SidebarLayout';
import AiAssistantChat from '@/components/assistant/AiAssistantChat';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const JADE_IMAGE = '/jadeAssistantAnimation/JadeAIAssistant.png';

function Assistant() {
    return (
        <SidebarLayout
            title="AI Assistant"
            subtitle="Read-only, source-grounded analytics for your clinic operations"
        >
            <div className="jade-assistant mx-auto flex h-[calc(100dvh-7rem)] min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-[#F0E3C6] bg-white text-[#262626] shadow-[0_22px_60px_-36px_rgba(58,43,9,0.35)] sm:h-[calc(100dvh-8.5rem)] sm:min-h-[38rem] print:h-auto print:max-w-none print:border-0 print:shadow-none">
                <header className="flex shrink-0 items-center gap-3 border-b border-[#F0E3C6] bg-white px-5 py-4 sm:px-7">
                    <div className="size-12 shrink-0 overflow-hidden rounded-full border border-[#F0D58F] bg-[#FFF5DE] p-0.5">
                        <img src={JADE_IMAGE} alt="Jade AI" draggable={false} className="size-full rounded-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-semibold">Jade AI</h2>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF8EF] px-2.5 py-1 text-[10px] font-medium text-[#16803A]">
                                <span className="size-1.5 rounded-full bg-[#16A34A]" />
                                Online
                            </span>
                        </div>
                        <p className="text-xs text-[#737373] sm:text-sm">Clinic intelligence assistant</p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="hidden text-[#8A6508] hover:bg-[#FFF5DE] sm:inline-flex print:hidden"
                        onClick={() => window.print()}
                    >
                        <Printer className="size-4" />
                        Print
                    </Button>
                </header>
                <div className="min-h-0 flex-1 p-4 sm:p-6">
                    <AiAssistantChat fill />
                </div>
            </div>
        </SidebarLayout>
    );
}

export default Assistant;
