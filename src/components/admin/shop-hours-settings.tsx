
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useMemo } from 'react';
import type { ShopSettings } from '@/types';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const settingsSchema = z.object({
  openingTime: z.string({ required_error: "Opening time is required." }),
  closingTime: z.string({ required_error: "Closing time is required." }),
}).refine(data => data.openingTime < data.closingTime, {
    message: "Closing time must be after opening time.",
    path: ["closingTime"],
});

const generateTimeOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        options.push(`${hour}:00`);
        options.push(`${hour}:30`);
    }
    return options;
};

export default function ShopHoursSettings() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'shopSettings', 'config') : null),
    [firestore]
  );
  const { data: settings, isLoading: settingsLoading } = useDoc<ShopSettings>(settingsRef);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      openingTime: "09:00",
      closingTime: "18:00",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
      });
    }
  }, [settings, form]);

  const onSubmit = async (values: z.infer<typeof settingsSchema>) => {
    if (!settingsRef) return;
    setIsSubmitting(true);
    try {
      await setDoc(settingsRef, values);
      toast({
        title: 'Settings Updated',
        description: 'Shop hours have been successfully updated.',
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An error occurred while saving the settings.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (settingsLoading) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-28 ml-auto" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="openingTime"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Opening Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select opening time" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {timeOptions.map(time => (
                        <SelectItem key={`open-${time}`} value={time}>{time}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="closingTime"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Closing Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select closing time" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {timeOptions.map(time => (
                        <SelectItem key={`close-${time}`} value={time}>{time}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
