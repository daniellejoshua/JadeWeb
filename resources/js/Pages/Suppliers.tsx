import SidebarLayout from '@/Layouts/SidebarLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { suppliers } from '@/data/mock';
import { cn } from '@/lib/utils';

function Suppliers() {
    return (
        <SidebarLayout title="Suppliers" subtitle={`${suppliers.length} suppliers on file`}>
            <DashboardCard>
                <CardHeader>
                    <CardTitle>Supplier Directory</CardTitle>
                    <CardDescription>All suppliers synced from the LAN POS</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Contact Person</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead className="hidden md:table-cell">Email</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="tabular-nums text-muted-foreground">
                                        {supplier.supplier_code}
                                    </TableCell>
                                    <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                                    <TableCell>{supplier.contact_person}</TableCell>
                                    <TableCell className="tabular-nums">{supplier.phone}</TableCell>
                                    <TableCell className="hidden text-muted-foreground md:table-cell">
                                        {supplier.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'rounded-full border-0',
                                                supplier.is_active
                                                    ? 'bg-gold-soft text-gold-strong'
                                                    : 'bg-muted text-muted-foreground',
                                            )}
                                        >
                                            {supplier.is_active ? 'Active' : 'Inactive'}
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

export default Suppliers;
