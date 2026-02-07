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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { AppUser } from '@/types';
import { useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const userEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  enabled: z.boolean().default(true),
});

interface UserEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
}

export function UserEditDialog({ isOpen, onOpenChange, user }: UserEditDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof userEditSchema>>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: '',
      enabled: true,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        // Handle case where `enabled` might be undefined for older user documents
        enabled: user.enabled !== false, 
      });
    }
  }, [user, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof userEditSchema>) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, { 
        name: values.name,
        enabled: values.enabled,
       });
      toast({
        title: 'User Updated',
        description: `Details for ${values.name} have been successfully updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An error occurred while saving user details.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User: {user?.name}</DialogTitle>
          <DialogDescription>
            Update the user's details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter user's full name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Account Enabled</FormLabel>
                    <FormDescription>
                      If disabled, the user will not be able to log in.
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
