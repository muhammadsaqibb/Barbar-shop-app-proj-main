
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Service } from '@/types';
import { useFirebase } from '@/firebase';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import useSound from '@/hooks/use-sound';

const serviceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  price: z.coerce.number().int().min(0, "Price must be a positive number."),
  discountedPrice: z.coerce.number().int().min(0).optional(),
  duration: z.coerce.number().int().min(5, "Duration must be at least 5 minutes."),
  isPackage: z.boolean().default(false),
  enabled: z.boolean().default(true),
  maxQuantity: z.coerce.number().int().min(1).optional(),
}).refine(data => !data.discountedPrice || data.discountedPrice < data.price, {
    message: "Discounted price must be less than the original price.",
    path: ["discountedPrice"],
});

interface ServiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
}

export function ServiceDialog({ isOpen, onOpenChange, service }: ServiceDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const playSound = useSound();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      discountedPrice: undefined,
      duration: 30,
      isPackage: false,
      enabled: true,
      maxQuantity: 50,
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        ...service,
        discountedPrice: service.discountedPrice || undefined,
        maxQuantity: service.maxQuantity || 50,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        price: 0,
        discountedPrice: undefined,
        duration: 30,
        isPackage: false,
        enabled: true,
        maxQuantity: 50,
      });
    }
  }, [service, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof serviceSchema>) => {
    playSound('click');
    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...values,
        discountedPrice: values.discountedPrice || null, // Store null if empty
      };

      if (service) {
        // Update existing service
        const serviceRef = doc(firestore, 'services', service.id);
        await setDoc(serviceRef, dataToSave, { merge: true });
        toast({
          title: 'Service Updated',
          description: `${values.name} has been successfully updated.`,
        });
      } else {
        // Create new service
        const servicesCollection = collection(firestore, 'services');
        await addDoc(servicesCollection, dataToSave);
        toast({
          title: 'Service Created',
          description: `${values.name} has been successfully added.`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save service:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'An error occurred while saving the service.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          <DialogDescription>
            {service ? 'Update the details of the service.' : 'Fill in the details for the new service.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Classic Haircut" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A short description of the service." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Price (PKR)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="2500" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="discountedPrice"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Discounted Price (Optional)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="2200" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Duration (min)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="maxQuantity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Max Quantity (Pax)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                     <FormDescription>
                      Maximum number of people for this service.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
              control={form.control}
              name="isPackage"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Is this a Package?</FormLabel>
                    <FormDescription>
                      Packages can be displayed separately.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Service'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
