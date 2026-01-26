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
  FormDescription,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { AppUser, StaffPermissions } from '@/types';
import { useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const permissionsSchema = z.object({
  canViewBookings: z.boolean().default(false),
  canAddWalkInBookings: z.boolean().default(false),
  canEditBookingStatus: z.boolean().default(false),
  canManageCustomers: z.boolean().default(false),
  canViewOverview: z.boolean().default(false),
});

interface StaffPermissionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
}

const defaultPermissions: StaffPermissions = {
    canViewBookings: false,
    canAddWalkInBookings: false,
    canEditBookingStatus: false,
    canManageCustomers: false,
    canViewOverview: false,
};

export function StaffPermissionsDialog({ isOpen, onOpenChange, user }: StaffPermissionsDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof permissionsSchema>>({
    resolver: zodResolver(permissionsSchema),
    defaultValues: defaultPermissions,
  });

  useEffect(() => {
    if (user) {
      form.reset({
        ...defaultPermissions,
        ...(user.permissions || {}),
      });
    }
  }, [user, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof permissionsSchema>) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, { permissions: values });
      toast({
        title: 'Permissions Updated',
        description: `Permissions for ${user.name} have been successfully updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save permissions:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An error occurred while saving permissions.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const PermissionSwitch = ({ name, label, description }: { name: keyof StaffPermissions, label: string, description: string }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
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
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Permissions for {user?.name}</DialogTitle>
          <DialogDescription>
            Configure what this staff member can see and do.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <PermissionSwitch name="canViewOverview" label="View Overview" description="Can access the main business overview page." />
            <PermissionSwitch name="canViewBookings" label="View Bookings" description="Can view and manage all appointments." />
            <PermissionSwitch name="canAddWalkInBookings" label="Add Walk-in Bookings" description="Can create new bookings for walk-in clients." />
            <PermissionSwitch name="canEditBookingStatus" label="Edit Booking Status" description="Can change appointment status (e.g., complete, cancel)." />
            <PermissionSwitch name="canManageCustomers" label="Manage Customers" description="Can view customer list and details." />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Permissions'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
