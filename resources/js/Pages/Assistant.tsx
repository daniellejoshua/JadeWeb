import SidebarLayout from '@/Layouts/SidebarLayout';
import AiAssistantChat from '@/components/assistant/AiAssistantChat';
import JadeAvatar from '@/components/assistant/JadeAvatar';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { CardContent } from '@/components/ui/card';

function Assistant() {
    return (
        <SidebarLayout
            title="AI Assistant"
            subtitle="Ask Jade anything about your clinic operations"
        >
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
                <DashboardCard className="flex flex-1 flex-col p-6">
                    <CardContent className="flex flex-1 flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <JadeAvatar size="md" />
                            <div className="flex flex-col leading-tight">
                                <span className="font-medium">Jade</span>
                                <span className="text-xs text-muted-foreground">
                                    AI Assistant · connected to dummy data
                                </span>
                            </div>
                        </div>
                        <AiAssistantChat />
                    </CardContent>
                </DashboardCard>
            </div>
        </SidebarLayout>
    );
}

export default Assistant;
