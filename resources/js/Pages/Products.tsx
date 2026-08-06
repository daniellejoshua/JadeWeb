import SidebarLayout from '@/Layouts/SidebarLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { products } from '@/data/mock';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

function stockStatus(product: { current_stock: number; reorder_level: number }) {
    if (product.current_stock <= 0) {
        return { label: 'Out of Stock', className: 'bg-destructive/10 text-destructive' };
    }
    if (product.current_stock <= product.reorder_level) {
        return { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'In Stock', className: 'bg-gold-soft text-gold-strong' };
}

function Products() {
    return (
        <SidebarLayout title="Products" subtitle={`${products.length} products on file`}>
            <DashboardCard>
                <CardHeader>
                    <CardTitle>Product Catalog</CardTitle>
                    <CardDescription>All products synced from the LAN POS</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right">Reorder Level</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right">Selling</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => {
                                const status = stockStatus(product);
                                return (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{product.product_name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {product.product_code}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{product.category}</TableCell>
                                        <TableCell className="text-right tabular-nums">{product.current_stock}</TableCell>
                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                            {product.reorder_level}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                            {formatCurrency(product.cost_price)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{formatCurrency(product.selling_price)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn('rounded-full border-0', status.className)}>
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </DashboardCard>
        </SidebarLayout>
    );
}

export default Products;
