import SidebarLayout from '@/Layouts/SidebarLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { inventoryLogs } from '@/data/mock';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const typeStyles: Record<string, string> = {
    IN: 'bg-gold-soft text-gold-strong',
    OUT: 'bg-destructive/10 text-destructive',
    ADJUST: 'bg-amber-100 text-amber-700',
};

function InventoryLogs() {
    return (
        <SidebarLayout title="Inventory Logs" subtitle={`${inventoryLogs.length} recent stock movements`}>
            <DashboardCard>
                <CardHeader>
                    <CardTitle>Inventory Log</CardTitle>
                    <CardDescription>Stock movements from the LAN POS</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="hidden text-right md:table-cell">Previous</TableHead>
                                <TableHead className="hidden text-right md:table-cell">New</TableHead>
                                <TableHead className="hidden lg:table-cell">Reference</TableHead>
                                <TableHead className="hidden lg:table-cell">User</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventoryLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-muted-foreground">
                                        {formatDateTime(log.created_at)}
                                    </TableCell>
                                    <TableCell className="font-medium">{log.product_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('rounded-full border-0', typeStyles[log.transaction_type])}>
                                            {log.transaction_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{log.quantity}</TableCell>
                                    <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                                        {log.previous_stock}
                                    </TableCell>
                                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                                        {log.new_stock}
                                    </TableCell>
                                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                                        {log.reference}
                                    </TableCell>
                                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                                        {log.user_name}
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

export default InventoryLogs;