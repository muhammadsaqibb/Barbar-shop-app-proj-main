
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { PaymentMethod } from '@/types';
import { useFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/language-provider';

const methodSchema = z.object({
  methodName: z.string().min(2, "Method name must be at least 2 characters."),
  accountHolderName: z.string().min(2, "Account holder name is required."),
  accountNumber: z.string().min(5, "Account number seems too short."),
});

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  method: PaymentMethod | null;
}

export function PaymentMethodDialog({ isOpen, onOpenChange, method }: PaymentMethodDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof methodSchema>>({
    resolver: zodResolver(methodSchema),
    defaultValues: {
      methodName: '',
      accountHolderName: '',
      accountNumber: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (method) {
        form.reset(method);
      } else {
        form.reset({
          methodName: '',
          accountHolderName: '',
          accountNumber: '',
        });
      }
    }
  }, [method, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof methodSchema>) => {
    setIsSubmitting(true);
    if (!firestore) return;
    
    const methodsCollectionRef = collection(doc(firestore, 'shopSettings', 'config'), 'paymentMethods');

    try {
      if (method) {
        // Update existing method
        const methodRef = doc(methodsCollectionRef, method.id);
        setDocumentNonBlocking(methodRef, values, { merge: true });
      } else {
        // Create new method
        addDocumentNonBlocking(methodsCollectionRef, values);
      }
      toast({
        title: t('method_saved_success_title'),
        description: t('method_saved_success_desc'),
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save payment method:', error);
      toast({
        variant: 'destructive',
        title: t('method_save_fail_title'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{method ? t('edit_method_title') : t('add_method_title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="methodName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('method_name_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('method_name_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountHolderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('account_holder_name_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('account_holder_name_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('account_number_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('account_number_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                {isSubmitting ? t('saving_account_button') : t('save_account_button')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
