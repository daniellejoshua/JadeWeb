import SidebarLayout from '@/Layouts/SidebarLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';

const sections = [
    { title: 'Company Settings', description: 'Company name, TIN, address, contact details and receipt footer.' },
    { title: 'Sync Settings', description: 'Connection to the LAN POS and scheduled sync times.' },
    { title: 'Notifications', description: 'Low-stock alerts, sync failures and daily sales summaries.' },
    { title: 'Security', description: 'Session timeout, password policies and audit log access.' },
];

function Settings() {
    return (
        <SidebarLayout title="Settings" subtitle="Clinic and sync configuration">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {sections.map((section) => (
                    <DashboardCard key={section.title}>
                        <CardHeader className="gap-3">
                            <div className="flex items-start justify-between gap-3">
                                <CardTitle>{section.title}</CardTitle>
                                <Badge variant="outline" className="rounded-full border-0 bg-muted text-muted-foreground">
                                    <Lock className="size-3" />
                                    Coming soon
                                </Badge>
                            </div>
                            <CardDescription>{section.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
                            <p>
                                Settings are currently read-only and powered by dummy data. Wiring is planned once
                                the dashboard connects to the real API.
                            </p>
                        </CardContent>
                    </DashboardCard>
                ))}
            </div>
        </SidebarLayout>
    );
}

export default Settings;
