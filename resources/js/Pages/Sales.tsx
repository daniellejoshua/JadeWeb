import SidebarLayout from '@/Layouts/SidebarLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { recentSales } from '@/data/mock';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
    Completed: 'bg-gold-soft text-gold-strong',
    Pending: 'bg-amber-100 text-amber-700',
    Void: 'bg-muted text-muted-foreground',
};

function Sales() {
    const sales = recentSales(12);

    return (
        <SidebarLayout title="Sales" subtitle={`${sales.length} recent transactions`}>
            <DashboardCard>
                <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                    <CardDescription>Latest transactions from the LAN POS</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sale #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead className="hidden md:table-cell">Cashier</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium tabular-nums">
                                        {sale.sale_number}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(sale.sale_date), 'MMM d, h:mm a')}
                                    </TableCell>
                                    <TableCell>{sale.customer_name}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {sale.user_name}
                                    </TableCell>
                                    <TableCell>{sale.payment_method}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('rounded-full border-0', statusStyles[sale.status])}>
                                            {sale.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">
                                        {formatCurrency(sale.total_amount)}
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

export default Sales;
