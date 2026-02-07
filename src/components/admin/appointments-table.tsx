
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
import { useEffect } from 'react';
import { serverTimestamp, doc, writeBatch, updateDoc } from 'firebase/firestore';
import { CountdownTimer } from '../ui/countdown-timer';
import { useCurrency } from '@/context/currency-provider';

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

const MobileAppointmentCard = ({ appointment, onStatusChange, formatPrice }: { appointment: Appointment, onStatusChange: () => void, formatPrice: (amount: number) => string }) => {
  const { firestore } = useFirebase();
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
              {appointment.bookingType === 'walk-in' && <Badge variant="secondary">Walk-In</Badge>}
              {appointment.clientPhone && <span className="text-muted-foreground">{appointment.clientPhone}</span>}
              <span>Booked By:</span>
              <Badge variant={appointment.bookedBy ? "secondary" : "outline"}>{appointment.bookedBy || 'Online'}</Badge>
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={getStatusVariant(appointment.status)} className="capitalize shrink-0">{appointment.status}</Badge>
            {appointment.status === 'pending' && <CountdownTimer createdAt={appointment.createdAt} onExpire={async () => {
              if (!firestore) return;
              try {
                await updateDoc(doc(firestore, 'appointments', appointment.id), {
                  status: 'cancelled',
                  notes: (appointment.notes || '') + ' [Auto: Expired (2m)]'
                });
                if (onStatusChange) onStatusChange();
              } catch (e) { console.error(e); }
            }} />}
          </div>
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
          <span className="font-bold">{formatPrice(appointment.totalPrice || 0)} ({appointment.totalDuration} min)</span>
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
  const { formatPrice } = useCurrency();

  const appointmentsCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'appointments'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: appointments, isLoading: loading, error, refetch: fetchAppointments } = useCollection<Appointment>(appointmentsCollectionRef);

  // Auto-cancel pending bookings older than 2 minutes
  useEffect(() => {
    if (!appointments || !firestore) return;

    const cancelExpiredBookings = async () => {
      const now = new Date();
      // Filter for PENDING appointments created more than 2 minutes ago
      const expiredAppointments = appointments.filter(apt => {
        if (apt.status !== 'pending') return false;

        let createdTime: Date;
        // Robust timestamp parsing
        if (apt.createdAt?.toDate) {
          createdTime = apt.createdAt.toDate();
        } else if (apt.createdAt?.seconds) {
          createdTime = new Date(apt.createdAt.seconds * 1000);
        } else if (typeof apt.createdAt === 'string') {
          createdTime = new Date(apt.createdAt);
        } else {
          // If no timestamp, assume it's old or skip. Better to skip to be safe.
          return false;
        }

        const diffInMinutes = (now.getTime() - createdTime.getTime()) / (1000 * 60);
        return diffInMinutes > 2;
      });

      if (expiredAppointments.length > 0) {
        console.log(`Auto-cleaning: Found ${expiredAppointments.length} expired bookings.`);
        const batch = writeBatch(firestore);

        expiredAppointments.forEach(apt => {
          const aptRef = doc(firestore, 'appointments', apt.id);
          batch.update(aptRef, {
            status: 'cancelled',
            notes: (apt.notes || '') + ' [Auto: Expired (2m)]'
          });
        });

        try {
          await batch.commit();
          console.log('Successfully cancelled expired bookings.');
          // Refresh logic might be needed if not real-time, but useCollection is usually real-time-ish
        } catch (error) {
          console.error('Failed to auto-cancel bookings:', error);
        }
      }
    };

    // Run check immediately on load, and then every 30 seconds
    cancelExpiredBookings();
    const intervalId = setInterval(cancelExpiredBookings, 30 * 1000);

    return () => clearInterval(intervalId);
  }, [appointments, firestore]);

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
    if (fetchAppointments) fetchAppointments();
  }

  const handleAutoCancel = async (id: string, notes?: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'appointments', id), {
        status: 'cancelled',
        notes: (notes || '') + ' [Auto: Expired (2m)]'
      });
      handleStatusChange();
    } catch (error) {
      console.error('Failed to auto-cancel:', error);
    }
  };

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
          <MobileAppointmentCard key={apt.id} appointment={apt} onStatusChange={handleStatusChange} formatPrice={formatPrice} />
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
                  <div className="flex flex-col">
                    <span>{apt.clientName}</span>
                    {apt.clientPhone && <span className="text-xs text-muted-foreground font-normal">{apt.clientPhone}</span>}
                  </div>
                  {apt.bookingType === 'walk-in' && <Badge variant="secondary" className="mt-1">Walk-In</Badge>}
                </TableCell>
                <TableCell>{apt.bookedBy || <Badge variant="outline">Online</Badge>}</TableCell>
                <TableCell className="font-medium max-w-xs truncate">{apt.services.map(s => `${s.name}${s.quantity && s.quantity > 1 ? ` x${s.quantity}` : ''}`).join(', ')}</TableCell>
                <TableCell>{formatPrice(apt.totalPrice || 0)}</TableCell>
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
                  <div className="flex flex-col gap-1 items-start">
                    <Badge variant={getStatusVariant(apt.status)} className="capitalize">
                      {apt.status}
                    </Badge>
                    {apt.status === 'pending' && <CountdownTimer createdAt={apt.createdAt} onExpire={() => handleAutoCancel(apt.id, apt.notes)} />}
                  </div>
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
