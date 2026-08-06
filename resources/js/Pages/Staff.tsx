import SidebarLayout from '@/Layouts/SidebarLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { staff } from '@/data/mock';
import { cn } from '@/lib/utils';

function Staff() {
    return (
        <SidebarLayout title="Staff" subtitle={`${staff.length} user accounts`}>
            <DashboardCard>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Users synced from the LAN POS</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="hidden md:table-cell">Phone</TableHead>
                                <TableHead className="hidden lg:table-cell">Email</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                    <TableCell className="tabular-nums text-muted-foreground">
                                        @{user.username}
                                    </TableCell>
                                    <TableCell>{user.user_role}</TableCell>
                                    <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">
                                        {user.phone}
                                    </TableCell>
                                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                                        {user.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'rounded-full border-0',
                                                user.is_active
                                                    ? 'bg-gold-soft text-gold-strong'
                                                    : 'bg-muted text-muted-foreground',
                                            )}
                                        >
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </DashboardCard>
        </SidebarLayout>
    );
}

export default Staff;
