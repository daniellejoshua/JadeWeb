import SidebarLayout from '@/Layouts/SidebarLayout';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { PageProps } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import {
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    Search,
    ShieldAlert,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type StaffRole = 'Admin' | 'Manager' | 'Staff';
type RoleFilter = 'all' | StaffRole;

type StaffRow = {
    id: number;
    employee_code: string | null;
    full_name: string;
    username: string;
    email: string | null;
    phone: string | null;
    user_role: StaffRole | null;
    is_active: boolean;
    photo_url: string | null;
};

type StaffDetail = StaffRow & { qr_value: string };

type StaffMeta = {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    from: number | null;
    to: number | null;
};

type StaffProps = {
    staff: StaffRow[];
    meta: StaffMeta;
    filters: { role: RoleFilter; search: string };
    viewerRole: string;
    accessDenied: boolean;
};

const roleOptions: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: 'All Users' },
    { value: 'Admin', label: 'Admins Only' },
    { value: 'Manager', label: 'Managers Only' },
    { value: 'Staff', label: 'Staff Only' },
];

const JADE = {
    gold: '#BE9A30',
    border: '#E8E6E1',
    text: '#20242A',
    textSecondary: '#626873',
    textMuted: '#8A8F98',
    active: '#2E9B45',
    inactive: '#D8402E',
};

function StaffAvatar({ src, name, className = 'size-12' }: { src: string | null; name: string; className?: string }) {
    const [failed, setFailed] = useState(false);

    useEffect(() => setFailed(false), [src]);

    return (
        <img
            src={!src || failed ? '/images/default-avatar.svg' : src}
            alt={`${name} profile`}
            onError={() => setFailed(true)}
            className={`${className} rounded-full border object-cover object-center shadow-sm`}
            style={{ borderColor: JADE.border }}
        />
    );
}

function Pagination({ meta, role, search }: { meta: StaffMeta; role: RoleFilter; search: string }) {
    function goToPage(page: number) {
        const params: Record<string, string | number> = { page };
        if (role !== 'all') params.role = role;
        if (search.trim() !== '') params.search = search.trim();

        router.get(
            route('staff'),
            params,
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    const buttonClass = 'inline-flex size-8 items-center justify-center rounded-lg border transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-35';

    return (
        <div className="flex items-center gap-1.5">
            <button type="button" className={buttonClass} disabled={meta.currentPage === 1} onClick={() => goToPage(1)} aria-label="First page">
                <ChevronFirst className="size-4" />
            </button>
            <button type="button" className={buttonClass} disabled={meta.currentPage === 1} onClick={() => goToPage(meta.currentPage - 1)} aria-label="Previous page">
                <ChevronLeft className="size-4" />
            </button>
            <span className="px-2 text-xs tabular-nums" style={{ color: JADE.textSecondary }}>
                Page {meta.currentPage} of {meta.lastPage}
            </span>
            <button type="button" className={buttonClass} disabled={meta.currentPage === meta.lastPage} onClick={() => goToPage(meta.currentPage + 1)} aria-label="Next page">
                <ChevronRight className="size-4" />
            </button>
            <button type="button" className={buttonClass} disabled={meta.currentPage === meta.lastPage} onClick={() => goToPage(meta.lastPage)} aria-label="Last page">
                <ChevronLast className="size-4" />
            </button>
        </div>
    );
}

function IdCard({ open, onOpenChange, staff, loading }: { open: boolean; onOpenChange: (open: boolean) => void; staff: StaffDetail | null; loading: boolean }) {
    const [qrCode, setQrCode] = useState<string | null>(null);

    useEffect(() => {
        setQrCode(null);
        if (!staff) return;

        QRCode.toDataURL(staff.qr_value, { width: 180, margin: 1, color: { dark: '#20242A', light: '#FFFFFF' } })
            .then(setQrCode)
            .catch(() => toast.error('Could not generate the staff QR code.'));
    }, [staff]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="sr-only">
                    <DialogTitle>Personnel ID card</DialogTitle>
                    <DialogDescription>Staff identity and contact information.</DialogDescription>
                </DialogHeader>
                {loading || !staff ? (
                    <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">Loading personnel card...</div>
                ) : (
                    <div className="relative bg-white">
                        <div className="h-24 bg-[#20242A]" />
                        <div className="absolute left-6 top-14 rounded-full border-4 border-white bg-white">
                            <StaffAvatar src={staff.photo_url} name={staff.full_name} className="size-24" />
                        </div>
                        <div className="absolute right-6 top-5 text-right text-white">
                            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#FEBF10]">Jade Clinic</p>
                            <p className="text-xs text-white/70">Personnel Identification</p>
                        </div>
                        <div className="grid gap-6 px-6 pb-6 pt-16 sm:grid-cols-[1fr_auto]">
                            <div className="min-w-0">
                                <h2 className="truncate text-xl font-bold" style={{ color: JADE.text }}>{staff.full_name}</h2>
                                <p className="mt-1 text-sm font-semibold" style={{ color: JADE.gold }}>{staff.user_role ?? 'Staff'}</p>
                                <dl className="mt-5 grid gap-3 text-sm">
                                    <div><dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Employee code</dt><dd className="font-medium">{staff.employee_code ?? 'Not assigned'}</dd></div>
                                    <div><dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Username</dt><dd>@{staff.username}</dd></div>
                                    <div><dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email</dt><dd className="break-all">{staff.email ?? 'Not provided'}</dd></div>
                                    <div><dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Phone</dt><dd>{staff.phone ?? 'Not provided'}</dd></div>
                                </dl>
                            </div>
                            <div className="flex flex-col items-center self-end rounded-xl border bg-white p-2" style={{ borderColor: JADE.border }}>
                                {qrCode ? <img src={qrCode} alt={`QR code for ${staff.employee_code ?? staff.username}`} className="size-28" /> : <div className="size-28 animate-pulse rounded bg-muted" />}
                                <span className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Scan ID</span>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Staff() {
    const { staff, meta, filters, viewerRole, accessDenied } = usePage<PageProps & StaffProps>().props;
    const [cardOpen, setCardOpen] = useState(false);
    const [cardLoading, setCardLoading] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffDetail | null>(null);
    const [flashingRow, setFlashingRow] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search);
    const firstSearchRender = useRef(true);

    function filterByRole(role: RoleFilter) {
        const params: Record<string, string> = {};
        if (role !== 'all') params.role = role;
        if (search.trim() !== '') params.search = search.trim();

        router.get(route('staff'), params, { preserveState: true, preserveScroll: true, replace: true });
    }

    useEffect(() => {
        if (firstSearchRender.current) {
            firstSearchRender.current = false;
            return;
        }

        const timer = window.setTimeout(() => {
            const params: Record<string, string> = {};
            if (filters.role !== 'all') params.role = filters.role;
            if (search.trim() !== '') params.search = search.trim();

            router.get(route('staff'), params, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);

        return () => window.clearTimeout(timer);
    }, [search]);

    async function viewStaff(row: StaffRow) {
        flash(row.id);
        setSelectedStaff(null);
        setCardLoading(true);
        setCardOpen(true);

        try {
            const response = await fetch(route('staff.show', row.id), { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('Staff details could not be loaded.');
            setSelectedStaff(await response.json() as StaffDetail);
        } catch (error) {
            setCardOpen(false);
            toast.error(error instanceof Error ? error.message : 'Staff details could not be loaded.');
        } finally {
            setCardLoading(false);
        }
    }

    function flash(id: number) {
        setFlashingRow(id);
        window.setTimeout(() => setFlashingRow((current) => current === id ? null : current), 180);
    }

    if (accessDenied) {
        return (
            <SidebarLayout title="Staff" subtitle="Personnel directory">
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border bg-white p-8 text-center" style={{ borderColor: JADE.border }}>
                    <ShieldAlert className="mb-4 size-10" style={{ color: JADE.inactive }} />
                    <h2 className="text-lg font-semibold">Access denied</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">Only Admin, Administrator, and Manager accounts can open the staff directory.</p>
                </div>
            </SidebarLayout>
        );
    }

    const exportParams: Record<string, string> = {};
    if (filters.role !== 'all') exportParams.role = filters.role;
    if (search.trim() !== '') exportParams.search = search.trim();
    const exportUrl = route('staff.export', exportParams);

    return (
        <SidebarLayout title="Staff" subtitle={`${meta.total} personnel records · ${viewerRole}`}>
            <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-white" style={{ borderColor: JADE.border }}>
                <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3" style={{ borderColor: JADE.border }}>
                    <div className="relative min-w-56 flex-1 sm:max-w-sm">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: JADE.textMuted }} />
                        <Input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search staff name..."
                            className="pl-9"
                            style={{ borderColor: JADE.border }}
                        />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: JADE.textSecondary }}>Filter by:</span>
                    <Select value={filters.role} onValueChange={(value) => filterByRole(value as RoleFilter)}>
                        <SelectTrigger className="w-44" style={{ borderColor: JADE.border }}><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {roleOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="ml-auto">
                        <Button variant="outline" asChild style={{ borderColor: JADE.border }}>
                            <a href={exportUrl}><Download className="size-4" />Export</a>
                        </Button>
                    </div>
                </div>

                <div className="min-h-0 overflow-x-auto">
                    <table className="w-full min-w-[900px] table-fixed text-xs">
                        <colgroup>
                            <col className="w-[11%]" /><col className="w-[7%]" /><col className="w-[14%]" />
                            <col className="w-[22%]" /><col className="w-[15%]" /><col className="w-[10%]" />
                            <col className="w-[13%]" /><col className="w-[8%]" />
                        </colgroup>
                        <thead>
                            <tr className="border-b" style={{ borderColor: JADE.border }}>
                                {['ID', 'Photo', 'Username', 'Email', 'Phone', 'Role', 'Status', 'View'].map((header) => (
                                    <th key={header} className="truncate px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide" style={{ color: JADE.text }}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map((row) => (
                                <tr key={row.id} className="border-b transition-colors hover:bg-[#FBF7EA]" style={{ borderColor: JADE.border }}>
                                    <td className="truncate px-3 py-2 font-semibold tabular-nums" title={row.employee_code ?? 'Not assigned'}>{row.employee_code ?? '—'}</td>
                                    <td className="px-3 py-2"><StaffAvatar src={row.photo_url} name={row.full_name} className="size-9" /></td>
                                    <td className="truncate px-3 py-2 text-left font-medium" title={row.username}>{row.username}</td>
                                    <td className="truncate px-3 py-2 text-left" title={row.email ?? undefined} style={{ color: JADE.textSecondary }}>{row.email ?? '—'}</td>
                                    <td className="truncate px-3 py-2 text-left tabular-nums" title={row.phone ?? undefined} style={{ color: JADE.textSecondary }}>{row.phone ?? '—'}</td>
                                    <td className="truncate px-3 py-2 font-medium">{row.user_role ?? 'Staff'}</td>
                                    <td className="px-3 py-2">
                                        <span className="font-bold whitespace-nowrap" style={{ color: row.is_active ? JADE.active : JADE.inactive }}>
                                            {row.is_active ? '✓ Active' : '✗ Inactive'}
                                        </span>
                                    </td>
                                    <td className={`p-0 text-center transition-colors ${flashingRow === row.id ? 'bg-[#FFF0B8]' : 'hover:bg-gray-100'}`}>
                                        <button type="button" className="flex h-[52px] w-full cursor-pointer items-center justify-center hover:text-[#BE9A30]" onClick={() => viewStaff(row)} aria-label={`View ${row.username}`} title="View staff ID">
                                            <Eye className="size-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {staff.length === 0 && (
                                <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-muted-foreground">No staff match the current search and role filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: JADE.border }}>
                    <span className="text-xs" style={{ color: JADE.textSecondary }}>
                        {meta.total === 0 ? 'No records' : `Showing ${meta.from} to ${meta.to} of ${meta.total} staff`}
                    </span>
                    <Pagination meta={meta} role={filters.role} search={search} />
                </div>
            </div>

            <IdCard open={cardOpen} onOpenChange={setCardOpen} staff={selectedStaff} loading={cardLoading} />
        </SidebarLayout>
    );
}

export default Staff;
