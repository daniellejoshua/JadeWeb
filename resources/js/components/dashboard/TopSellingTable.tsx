import DashboardCard from '@/components/dashboard/DashboardCard';
import {
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { topProducts } from '@/data/mock';
import { formatCurrency } from '@/lib/format';
import { ArrowUpRight, Package } from 'lucide-react';
import { route } from 'ziggy-js';

function TopSellingTable() {
    return (
        <DashboardCard>
            <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Best performers this month</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity Sold</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                            <TableHead className="hidden sm:table-cell">Store</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                            <Package className="size-4" />
                                        </div>
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate font-medium">{product.product_name}</span>
                                            <span className="text-xs text-muted-foreground">{product.category}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {product.quantity_sold.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-medium tabular-nums">
                                    {formatCurrency(product.revenue)}
                                </TableCell>
                                <TableCell className="hidden text-muted-foreground sm:table-cell">
                                    {product.store}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="justify-center gap-1 rounded-b-[20px] border-t bg-transparent py-4">
                <Link
                    href={route('products')}
                    className="inline-flex items-center gap-1 text-sm font-medium text-gold-strong hover:underline"
                >
                    View All Products
                    <ArrowUpRight className="size-4" />
                </Link>
            </CardFooter>
        </DashboardCard>
    );
}

export default TopSellingTable;
