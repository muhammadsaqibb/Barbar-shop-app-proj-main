
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Barber } from '@/types';
import { useFirebase } from '@/firebase';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import useSound from '@/hooks/use-sound';

const barberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().optional(),
});

interface BarberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  barber: Barber | null;
}

export function BarberDialog({ isOpen, onOpenChange, barber }: BarberDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const playSound = useSound();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof barberSchema>>({
    resolver: zodResolver(barberSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (barber) {
      form.reset({ name: barber.name, phone: barber.phone || '' });
    } else {
      form.reset({ name: '', phone: '' });
    }
  }, [barber, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof barberSchema>) => {
    playSound('click');
    setIsSubmitting(true);
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Database not available.' });
        setIsSubmitting(false);
        return;
    }

    try {
      if (barber) {
        // Update existing barber
        const barberRef = doc(firestore, 'barbers', barber.id);
        await setDoc(barberRef, values, { merge: true });
        toast({
          title: 'Barber Updated',
          description: `${values.name} has been successfully updated.`,
        });
      } else {
        // Create new barber
        const barbersCollection = collection(firestore, 'barbers');
        await addDoc(barbersCollection, values);
        toast({
          title: 'Barber Added',
          description: `${values.name} has been successfully added.`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save barber:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'An error occurred while saving the barber.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{barber ? 'Edit Barber' : 'Add New Barber'}</DialogTitle>
          <DialogDescription>
            {barber ? 'Update the details of the barber.' : 'Fill in the details for the new barber.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barber Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 03001234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Barber'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
