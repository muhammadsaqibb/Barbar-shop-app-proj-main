"use client";

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addMinutes, parse } from 'date-fns';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc } from 'firebase/firestore';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/components/auth-provider';
import { useTranslation } from '@/context/language-provider';
import type { Service, Barber, Appointment, ShopSettings } from '@/types';
import { Plus, Minus, Scissors, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useCurrency } from '@/context/currency-provider';

const generateTimeSlots = (openingTime = "09:00", closingTime = "18:00") => {
    const slots = [];
    let current = parse(openingTime, 'HH:mm', new Date());
    const end = parse(closingTime, 'HH:mm', new Date());

    while (current < end) {
        slots.push(format(current, 'h:mm a'));
        current = addMinutes(current, 15);
    }
    return slots;
};

const walkInSchema = z.object({
    clientName: z.string().optional(),
    clientPhone: z.string().optional(),
    services: z.record(z.string(), z.number().min(1)).refine((obj) => Object.keys(obj).length > 0, {
        message: 'Select at least one service.',
    }),
    date: z.date({ required_error: 'Date is required.' }),
    time: z.string({ required_error: 'Time is required.' }),
    barberId: z.string().optional(),
    paymentMethod: z.enum(['cash', 'online', 'pending']).default('cash'),
    paymentStatus: z.enum(['paid', 'unpaid', 'pending']).default('unpaid'),
    notes: z.string().optional(),
});

interface WalkInBookingFormProps {
    onSuccess?: () => void;
}

export function WalkInBookingForm({ onSuccess }: WalkInBookingFormProps) {
    const { user } = useAuth();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const { t } = useTranslation();
    const { formatPrice } = useCurrency();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dailyBookings, setDailyBookings] = useState<Appointment[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const servicesRef = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
    const { data: services } = useCollection<Service>(servicesRef);

    const barbersRef = useMemoFirebase(() => firestore ? collection(firestore, 'barbers') : null, [firestore]);
    const { data: barbers } = useCollection<Barber>(barbersRef);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'shopSettings', 'config') : null, [firestore]);
    const { data: settings } = useDoc<ShopSettings>(settingsRef);

    const form = useForm<z.infer<typeof walkInSchema>>({
        resolver: zodResolver(walkInSchema),
        defaultValues: {
            services: {},
            date: new Date(),
            paymentMethod: 'cash',
            paymentStatus: 'unpaid',
            barberId: 'any',
            notes: '',
        },
    });

    const watchedDate = form.watch('date');
    const watchedServices = form.watch('services');

    useEffect(() => {
        if (!watchedDate || !firestore) return;
        const fetchSlots = async () => {
            setLoadingSlots(true);
            try {
                const q = query(
                    collection(firestore, 'appointments'),
                    where('date', '==', format(watchedDate, 'PPP')),
                    where('status', 'in', ['confirmed', 'pending'])
                );
                const snap = await getDocs(q);
                setDailyBookings(snap.docs.map(d => d.data() as Appointment));
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [watchedDate, firestore]);

    const allTimeSlots = useMemo(() => {
        return generateTimeSlots(settings?.openingTime, settings?.closingTime);
    }, [settings]);

    const totalDuration = useMemo(() => {
        if (!services || !watchedServices) return 0;
        return Object.entries(watchedServices).reduce((acc, [id, qty]) => {
            const s = services.find(s => s.id === id);
            return acc + (s?.duration || 0) * (qty || 1);
        }, 0);
    }, [watchedServices, services]);

    const totalPrice = useMemo(() => {
        if (!services || !watchedServices) return 0;
        return Object.entries(watchedServices).reduce((acc, [id, qty]) => {
            const s = services.find(s => s.id === id);
            const price = s?.discountedPrice || s?.price || 0;
            return acc + price * (qty || 1);
        }, 0);
    }, [watchedServices, services]);

    const availableSlots = useMemo(() => {
        if (!watchedDate || !totalDuration || allTimeSlots.length === 0) return allTimeSlots;

        const dateStr = format(watchedDate, 'PPP');
        const bookedIntervals = dailyBookings.map(b => {
            try {
                const start = parse(`${b.date} ${b.time}`, 'PPP h:mm a', new Date());
                return { start, end: addMinutes(start, b.totalDuration) };
            } catch { return null; }
        }).filter(Boolean) as { start: Date, end: Date }[];

        const [cHour, cMin] = (settings?.closingTime || "18:00").split(':').map(Number);
        const shopClose = parse(`${dateStr} ${cHour}:${cMin}`, 'PPP H:mm', new Date());

        return allTimeSlots.filter(slot => {
            try {
                const start = parse(`${dateStr} ${slot}`, 'PPP h:mm a', new Date());
                const end = addMinutes(start, totalDuration);
                if (end > shopClose) return false;
                return !bookedIntervals.some(i => start < i.end && end > i.start);
            } catch { return false; }
        });
    }, [allTimeSlots, dailyBookings, totalDuration, watchedDate, settings]);

    async function onSubmit(values: z.infer<typeof walkInSchema>) {
        if (!firestore || !user) return;
        setIsSubmitting(true);
        try {
            const selectedServicesDetails = Object.entries(values.services).map(([id, quantity]) => {
                const s = services?.find(srv => srv.id === id)!;
                return {
                    id: s.id,
                    name: s.name,
                    price: s.discountedPrice || s.price,
                    duration: s.duration,
                    quantity
                };
            });

            const appointment: any = {
                shopId: user.shopId || '',
                clientId: null,
                clientName: values.clientName || 'Walk-in',
                clientPhone: values.clientPhone || null,
                services: selectedServicesDetails,
                totalPrice,
                totalDuration,
                date: format(values.date, 'PPP'),
                time: values.time,
                barberId: values.barberId === 'any' ? null : values.barberId || null,
                notes: values.notes || '',
                status: 'confirmed',
                paymentMethod: values.paymentMethod,
                paymentStatus: values.paymentStatus,
                createdAt: serverTimestamp(),
                bookedBy: user.name,
                bookingType: 'walk-in'
            };

            await addDoc(collection(firestore, 'appointments'), appointment);
            toast({ title: "Booking Saved", description: "Walk-in booking created successfully." });
            form.reset();
            onSuccess?.();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    const toggleService = (id: string) => {
        const current = { ...watchedServices };
        if (current[id]) {
            delete current[id];
        } else {
            current[id] = 1;
        }
        form.setValue('services', current);
    };

    const updateQty = (id: string, delta: number) => {
        const current = { ...watchedServices };
        if (!current[id]) return;
        const next = Math.max(1, (current[id] || 1) + delta);
        current[id] = next;
        form.setValue('services', current);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('customer_name')} (Optional)</FormLabel>
                                <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="clientPhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('phone_number')} (Optional)</FormLabel>
                                <FormControl><Input placeholder="+92 300 1234567" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-3">
                    <FormLabel>{t('select_services')}</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-4 max-h-48 overflow-y-auto bg-muted/20">
                        {services?.filter(s => s.enabled).map(s => (
                            <div key={s.id} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent group">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id={`srv-${s.id}`}
                                        checked={!!watchedServices?.[s.id]}
                                        onCheckedChange={() => toggleService(s.id)}
                                    />
                                    <label htmlFor={`srv-${s.id}`} className="text-sm font-medium cursor-pointer flex flex-col">
                                        <span>{s.name}</span>
                                        <span className="text-xs text-muted-foreground">{s.duration} min - {formatPrice(s.discountedPrice || s.price)}</span>
                                    </label>
                                </div>
                                {watchedServices?.[s.id] && (
                                    <div className="flex items-center gap-1 bg-background border rounded-lg px-2 py-0.5">
                                        <button type="button" onClick={() => updateQty(s.id, -1)} className="hover:text-primary"><Minus className="h-3 w-3" /></button>
                                        <span className="text-xs font-bold w-4 text-center">{watchedServices[s.id]}</span>
                                        <button type="button" onClick={() => updateQty(s.id, 1)} className="hover:text-primary"><Plus className="h-3 w-3" /></button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Time Slot</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <Clock className="mr-2 h-4 w-4 opacity-50" />
                                            <SelectValue placeholder={loadingSlots ? "Loading..." : "Select time"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="max-h-48">
                                        {availableSlots.map(slot => (
                                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('payment_method')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="cash">{t('payment_cash')}</SelectItem>
                                        <SelectItem value="online">{t('payment_online')}</SelectItem>
                                        <SelectItem value="pending">{t('payment_pending')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="paymentStatus"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="unpaid">Unpaid</SelectItem>
                                        <SelectItem value="paid">{t('payment_paid')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Estimated Total</p>
                        <p className="text-3xl font-black text-primary">{formatPrice(totalPrice)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total Duration</p>
                        <p className="text-xl font-bold">{totalDuration} min</p>
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting || !watchedServices || Object.keys(watchedServices).length === 0}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</> : t('save_booking')}
                </Button>
            </form>
        </Form>
    );
}

export function WalkInBookingDialog() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-bold flex gap-2">
                    <Plus className="h-4 w-4" /> {t('walk_in_booking')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-headline uppercase">{t('walk_in_booking')}</DialogTitle>
                    <DialogDescription>{t('walk_in_desc')}</DialogDescription>
                </DialogHeader>
                <WalkInBookingForm onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
