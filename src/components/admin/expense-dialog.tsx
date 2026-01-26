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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Expense } from '@/types';
import { useFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc, addDoc } from 'firebase/firestore';
import useSound from '@/hooks/use-sound';

const expenseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  notes: z.string().optional(),
});

interface ExpenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

export function ExpenseDialog({ isOpen, onOpenChange, expense }: ExpenseDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const playSound = useSound();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: '',
      amount: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (expense) {
      form.reset({
        name: expense.name,
        amount: expense.amount,
        notes: expense.notes || '',
      });
    } else {
      form.reset({
        name: '',
        amount: 0,
        notes: '',
      });
    }
  }, [expense, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    playSound('click');
    setIsSubmitting(true);
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Database not available.' });
        setIsSubmitting(false);
        return;
    }

    try {
      if (expense) {
        // Update existing expense
        const expenseRef = doc(firestore, 'expenses', expense.id);
        // We preserve the original createdAt timestamp
        await setDoc(expenseRef, { ...values, createdAt: expense.createdAt }, { merge: true });
        toast({
          title: 'Expense Updated',
          description: `${values.name} has been successfully updated.`,
        });
      } else {
        // Create new expense
        const expensesCollection = collection(firestore, 'expenses');
        const newExpense = { ...values, createdAt: serverTimestamp() };
        await addDoc(expensesCollection, newExpense);
        toast({
          title: 'Expense Added',
          description: `${values.name} has been successfully added.`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save expense:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'An error occurred while saving the expense.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
          <DialogDescription>
            {expense ? 'Update the details of the expense.' : 'Fill in the details for the new expense.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Daily Khana, Shop Rent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Amount (PKR)</FormLabel>
                  <FormControl>
                      <Input type="number" placeholder="5000" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional details about the expense." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
