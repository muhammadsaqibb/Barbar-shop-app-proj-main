'use client';

import { useMemo } from 'react';
import StaffAdminRoute from "@/components/admin/staff-admin-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, XCircle, Wallet, BadgeCheck, UserX } from "lucide-react";
import AppointmentsChart from "@/components/overview/appointments-chart";
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Appointment } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

export default function OverviewPage() {
    const { firestore } = useFirebase();

    const appointmentsQuery = useMemoFirebase(
      () => (firestore ? query(collection(firestore, 'appointments'), orderBy('createdAt', 'desc')) : null),
      [firestore]
    );
  
    const { data: appointments, isLoading, error } = useCollection<Appointment>(appointmentsQuery);

    const stats = useMemo(() => {
        if (!appointments) {
          return {
            totalRevenue: 0,
            totalBookings: 0,
            pendingCount: 0,
            confirmedCount: 0,
            completedCount: 0,
            cancelledCount: 0,
            noShowCount: 0,
          };
        }
    
        const totalRevenue = appointments
          .filter(apt => apt.status === 'completed')
          .reduce((sum, apt) => sum + apt.totalPrice, 0);
    
        return {
          totalRevenue,
          totalBookings: appointments.length,
          pendingCount: appointments.filter(apt => apt.status === 'pending').length,
          confirmedCount: appointments.filter(apt => apt.status === 'confirmed').length,
          completedCount: appointments.filter(apt => apt.status === 'completed').length,
          cancelledCount: appointments.filter(apt => apt.status === 'cancelled').length,
          noShowCount: appointments.filter(apt => apt.status === 'no-show').length,
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
                        title="Total Revenue" 
                        value={`PKR ${stats.totalRevenue.toLocaleString()}`} 
                        icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                        description="From completed appointments"
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
                        description="Awaiting confirmation"
                    />
                     <StatCard 
                        title="Confirmed" 
                        value={stats.confirmedCount}
                        icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                        description="Upcoming appointments"
                    />
                     <StatCard 
                        title="Completed" 
                        value={stats.completedCount}
                        icon={<BadgeCheck className="h-4 w-4 text-muted-foreground" />}
                        description="Finished appointments"
                    />
                    <StatCard 
                        title="Cancelled" 
                        value={stats.cancelledCount}
                        icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
                        description="Cancelled by staff"
                    />
                     <StatCard 
                        title="No Shows" 
                        value={stats.noShowCount}
                        icon={<UserX className="h-4 w-4 text-muted-foreground" />}
                        description="Clients who did not appear"
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
