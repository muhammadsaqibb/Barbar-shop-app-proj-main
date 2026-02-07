'use client';

import { useMemo } from 'react';
import StaffAdminRoute from "@/components/admin/staff-admin-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, XCircle, Wallet, BadgeCheck, UserX, Gift } from "lucide-react";
import AppointmentsChart from "@/components/overview/appointments-chart";
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Appointment } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/context/currency-provider';

const StatCard = ({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description?: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </CardContent>
    </Card>
);

export default function OverviewPage() {
    const { firestore } = useFirebase();
    const { formatPrice, currency } = useCurrency();

    const appointmentsQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'appointments'), orderBy('createdAt', 'desc')) : null),
        [firestore]
    );

    const { data: appointments, isLoading, error } = useCollection<Appointment>(appointmentsQuery);

    const stats = useMemo(() => {
        if (!appointments) {
            return {
                totalRevenue: 0,
                totalSales: 0,
                totalBookings: 0,
                pendingCount: 0,
                pendingRevenue: 0,
                confirmedCount: 0,
                confirmedRevenue: 0,
                completedCount: 0,
                completedRevenue: 0,
                cancelledCount: 0,
                cancelledRevenue: 0,
                noShowCount: 0,
                noShowRevenue: 0,
            };
        }

        const getStatsForStatus = (status: string) => {
            const filtered = appointments.filter(apt => apt.status === status);
            return {
                count: filtered.length,
                revenue: filtered.reduce((sum, apt) => sum + (apt.totalPrice || 0), 0)
            };
        };

        const pending = getStatsForStatus('pending');
        const confirmed = getStatsForStatus('confirmed');
        const completed = getStatsForStatus('completed');
        const cancelled = getStatsForStatus('cancelled');
        const noShow = getStatsForStatus('no-show');

        const totalRevenue = completed.revenue;
        const totalSales = confirmed.revenue + completed.revenue;

        // Referral Stats
        const discountedAppointments = appointments.filter(apt => (apt.rewardApplied || 0) > 0);
        const totalRewardsRedeemed = discountedAppointments.reduce((sum, apt) => sum + (apt.rewardApplied || 0), 0);

        return {
            totalRevenue,
            totalSales,
            totalBookings: appointments.length,
            pendingCount: pending.count,
            pendingRevenue: pending.revenue,
            confirmedCount: confirmed.count,
            confirmedRevenue: confirmed.revenue,
            completedCount: completed.count,
            completedRevenue: completed.revenue,
            cancelledCount: cancelled.count,
            cancelledRevenue: cancelled.revenue,
            noShowCount: noShow.count,
            noShowRevenue: noShow.revenue,
            totalRewardsRedeemed,
            discountedBookingsCount: discountedAppointments.length,
        };
    }, [appointments]);

    if (isLoading) {
        return (
            <StaffAdminRoute>
                <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                    <h1 className="text-3xl font-headline mb-6">Business Overview</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[...Array(7)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <Skeleton className="h-4 w-24" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-16 mb-2" />
                                    <Skeleton className="h-3 w-32" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Appointments Summary</CardTitle>
                            <CardDescription>A summary of appointments over the last 6 months.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <Skeleton className="h-full w-full" />
                        </CardContent>
                    </Card>
                </div>
            </StaffAdminRoute>
        )
    }

    if (error) {
        return <div className="container mx-auto p-4"><p className="text-destructive text-center py-8">Failed to load overview data. Please try again later.</p></div>
    }

    return (
        <StaffAdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <h1 className="text-3xl font-headline mb-6">Business Overview</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Total Sales"
                        value={formatPrice(stats.totalSales)}
                        icon={<BadgeCheck className="h-4 w-4 text-primary" />}
                        description={currency !== 'PKR' ? `Base: PKR ${stats.totalSales.toLocaleString()}` : "Confirmed + Completed"}
                    />
                    <StatCard
                        title="Total Revenue"
                        value={formatPrice(stats.totalRevenue)}
                        icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                        description={currency !== 'PKR' ? `Base: PKR ${stats.totalRevenue.toLocaleString()}` : "Finished appointments"}
                    />
                    <StatCard
                        title="Total Bookings"
                        value={stats.totalBookings}
                        icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                        description="All appointments created"
                    />
                    <StatCard
                        title="Pending"
                        value={stats.pendingCount}
                        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                        description={
                            <div className="flex flex-col">
                                <span>Value: {formatPrice(stats.pendingRevenue)}</span>
                                {currency !== 'PKR' && <span className="text-[10px] opacity-70">Base: PKR {stats.pendingRevenue.toLocaleString()}</span>}
                            </div>
                        }
                    />
                    <StatCard
                        title="Confirmed"
                        value={stats.confirmedCount}
                        icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                        description={
                            <div className="flex flex-col">
                                <span>Value: {formatPrice(stats.confirmedRevenue)}</span>
                                {currency !== 'PKR' && <span className="text-[10px] opacity-70">Base: PKR {stats.confirmedRevenue.toLocaleString()}</span>}
                            </div>
                        }
                    />
                    <StatCard
                        title="Completed"
                        value={stats.completedCount}
                        icon={<BadgeCheck className="h-4 w-4 text-muted-foreground" />}
                        description={
                            <div className="flex flex-col">
                                <span>Value: {formatPrice(stats.completedRevenue)}</span>
                                {currency !== 'PKR' && <span className="text-[10px] opacity-70">Base: PKR {stats.completedRevenue.toLocaleString()}</span>}
                            </div>
                        }
                    />
                    <StatCard
                        title="Cancelled"
                        value={stats.cancelledCount}
                        icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
                        description={
                            <div className="flex flex-col">
                                <span>Lost: {formatPrice(stats.cancelledRevenue)}</span>
                                {currency !== 'PKR' && <span className="text-[10px] opacity-70">Base: PKR {stats.cancelledRevenue.toLocaleString()}</span>}
                            </div>
                        }
                    />
                    <StatCard
                        title="No Shows"
                        value={stats.noShowCount}
                        icon={<UserX className="h-4 w-4 text-muted-foreground" />}
                        description={
                            <div className="flex flex-col">
                                <span>Lost: {formatPrice(stats.noShowRevenue)}</span>
                                {currency !== 'PKR' && <span className="text-[10px] opacity-70">Base: PKR {stats.noShowRevenue.toLocaleString()}</span>}
                            </div>
                        }
                    />
                    <StatCard
                        title="Referral Redemptions"
                        value={formatPrice(stats.totalRewardsRedeemed || 0)}
                        icon={<Gift className="h-4 w-4 text-emerald-500" />}
                        description={
                            <div className="flex flex-col">
                                <span>{stats.discountedBookingsCount || 0} appointments discounted</span>
                                {currency !== 'PKR' && (stats.totalRewardsRedeemed || 0) > 0 && <span className="text-[10px] opacity-70">Base: PKR {(stats.totalRewardsRedeemed || 0).toLocaleString()}</span>}
                            </div>
                        }
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Appointments Summary</CardTitle>
                        <CardDescription>A summary of appointments over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AppointmentsChart appointments={appointments || []} />
                    </CardContent>
                </Card>
            </div>
        </StaffAdminRoute>
    );
}
