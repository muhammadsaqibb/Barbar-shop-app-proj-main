
"use client";

import { useMemo } from 'react';
import type { Appointment } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import AppointmentActions from './appointment-actions';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format, addMinutes, parse } from 'date-fns';
import PaymentStatusUpdater from './payment-status-updater';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

const formatTimeRange = (startTimeStr: string, dateStr: string, duration: number): string => {
    if (!startTimeStr || !dateStr || !duration) return startTimeStr;
    try {
        const startTime = parse(`${dateStr} ${startTimeStr}`, 'PPP h:mm a', new Date());
        const endTime = addMinutes(startTime, duration);
        return `${startTimeStr} - ${format(endTime, 'h:mm a')}`;
    } catch (e) {
        console.error("Error formatting time range:", e);
        return startTimeStr;
    }
};

const MobileAppointmentCard = ({ appointment, onStatusChange }: { appointment: Appointment, onStatusChange: () => void }) => {
    const getStatusVariant = (status: Appointment['status']) => {
        switch (status) {
          case 'pending': return 'secondary';
          case 'confirmed': return 'default';
          case 'cancelled': case 'no-show': return 'destructive';
          case 'completed': return 'outline';
          default: return 'outline';
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start gap-2">
                    <div className='flex-1'>
                        <CardTitle className="text-lg break-words">{appointment.clientName}</CardTitle>
                        <CardDescription className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1 text-xs">
                           {appointment.clientId === 'walk-in' && <Badge variant="secondary">Walk-In</Badge>}
                            <span>Booked By:</span>
                            <Badge variant={appointment.bookedBy ? "secondary" : "outline"}>{appointment.bookedBy || 'Online'}</Badge>
                        </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(appointment.status)} className="capitalize shrink-0">{appointment.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{appointment.date}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{formatTimeRange(appointment.time, appointment.date, appointment.totalDuration)}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                    <span className="text-muted-foreground shrink-0">Services:</span>
                    <span className="font-medium text-right">{appointment.services.map(s => `${s.name}${s.quantity && s.quantity > 1 ? ` x${s.quantity}` : ''}`).join(', ')}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold">PKR {appointment.totalPrice?.toLocaleString()} ({appointment.totalDuration} min)</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payment:</span>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{appointment.paymentMethod}</Badge>
                        <div className="w-28">
                             <PaymentStatusUpdater appointment={appointment} />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/50 p-2">
                <AppointmentActions appointmentId={appointment.id} currentStatus={appointment.status} onStatusChange={onStatusChange} />
            </CardFooter>
        </Card>
    );
};

export default function AppointmentsTable() {
  const { firestore } = useFirebase();

  const appointmentsCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'appointments'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: appointments, isLoading: loading, error, refetch: fetchAppointments } = useCollection<Appointment>(appointmentsCollectionRef);

  const sortedAppointments = useMemo(() => {
    if (!appointments) return [];
    return [...appointments].sort((a, b) => {
        // Prioritize 'pending' status
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;

        // Then by confirmed status
        if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
        if (a.status !== 'confirmed' && b.status === 'confirmed') return 1;

        // Then sort by creation date descending
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });
  }, [appointments]);


  const handleStatusChange = () => {
    if(fetchAppointments) fetchAppointments();
  }

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'cancelled':
      case 'no-show':
        return 'destructive';
      case 'completed':
          return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  if (error) {
    return <p className="text-destructive text-center">{error.message}</p>;
  }

  if (!sortedAppointments || sortedAppointments.length === 0) {
    return <p className="text-muted-foreground text-center">There are no appointments scheduled.</p>;
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
          {sortedAppointments.map((apt) => (
              <MobileAppointmentCard key={apt.id} appointment={apt} onStatusChange={handleStatusChange} />
          ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-md border border-border/20">
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Booked By</TableHead>
                <TableHead>Service(s)</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedAppointments.map((apt) => (
                <TableRow key={apt.id}>
                    <TableCell className="font-medium">
                        {apt.clientName}
                        {apt.clientId === 'walk-in' && <Badge variant="secondary" className="ml-2">Walk-In</Badge>}
                    </TableCell>
                    <TableCell>{apt.bookedBy || <Badge variant="outline">Online</Badge>}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{apt.services.map(s => `${s.name}${s.quantity && s.quantity > 1 ? ` x${s.quantity}` : ''}`).join(', ')}</TableCell>
                    <TableCell>PKR {apt.totalPrice?.toLocaleString()}</TableCell>
                    <TableCell>{apt.date}</TableCell>
                    <TableCell>{formatTimeRange(apt.time, apt.date, apt.totalDuration)}</TableCell>
                    <TableCell>{apt.totalDuration} min</TableCell>
                     <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {apt.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[120px]">
                        <PaymentStatusUpdater appointment={apt} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(apt.status)} className="capitalize">
                          {apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AppointmentActions appointmentId={apt.id} currentStatus={apt.status} onStatusChange={handleStatusChange} />
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </>
  );
}
