
"use client";

import type { Expense } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '../ui/button';
import { Edit, PlusCircle, Trash, Search, Wallet, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ExpenseDialog } from './expense-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '../ui/date-range-picker';
import type { DateRange } from 'react-day-picker';


const MobileExpenseCard = ({ expense, onEdit, onDelete }: { expense: Expense, onEdit: (expense: Expense) => void, onDelete: (expenseId: string) => void }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">{expense.name}</CardTitle>
            <CardDescription>PKR {expense.amount?.toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{expense.createdAt?.toDate ? format(expense.createdAt.toDate(), 'PPP') : 'N/A'}</span>
            </div>
            {expense.notes && (
                <div>
                    <h4 className="text-sm font-semibold">Notes</h4>
                    <p className="text-sm text-muted-foreground truncate">{expense.notes}</p>
                </div>
            )}
        </CardContent>
        <CardFooter className="bg-muted/50 p-2 flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(expense)}>
                <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the expense.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(expense.id)}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
    </Card>
);


export default function ExpensesTable() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const expensesCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'expenses'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: expenses, isLoading: loading, error } = useCollection<Expense>(expensesCollectionRef);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    let filtered = expenses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(expense => 
          expense.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by date range
    if (date?.from) {
      filtered = filtered.filter(expense => {
          if (!expense.createdAt?.toDate) return false;
          const expenseDate = expense.createdAt.toDate();
          const fromDateStart = new Date(date.from!.setHours(0, 0, 0, 0));
          const toDateEnd = date.to ? new Date(date.to.setHours(23, 59, 59, 999)) : fromDateStart;
          return expenseDate >= fromDateStart && expenseDate <= toDateEnd;
      });
    }

    return filtered;
  }, [expenses, searchTerm, date]);

  const totalExpenses = useMemo(() => {
    if (!filteredExpenses) return 0;
    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
  }, [filteredExpenses]);

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedExpense(null);
    setDialogOpen(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (!firestore) return;
    const expenseRef = doc(firestore, 'expenses', expenseId);
    try {
        await deleteDoc(expenseRef);
        toast({
            title: "Expense Deleted",
            description: "The expense has been successfully deleted.",
        });
    } catch(e) {
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: 'Could not delete the expense.',
        })
    }
  }

  const handleSetDateFilter = (filter: 'thisWeek' | 'thisMonth') => {
    const today = new Date();
    let newDateRange: DateRange;
    if (filter === 'thisWeek') {
      newDateRange = { from: startOfWeek(today), to: endOfWeek(today) };
    } else { // thisMonth
      newDateRange = { from: startOfMonth(today), to: endOfMonth(today) };
    }
    setDate(newDateRange);
    setActiveFilter(filter);
  };

  const handleClearFilters = () => {
    setDate(undefined);
    setSearchTerm('');
    setActiveFilter(null);
  };

  const hasActiveFilters = searchTerm || date;

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full max-w-xs" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2 mt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    )
  }

  if (error) {
    return <p className="text-destructive text-center">{error.message}</p>;
  }

  return (
    <>
    <div className="mb-6">
        <Card className="w-full max-w-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">PKR {totalExpenses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                    {hasActiveFilters ? 'Total of filtered expenses' : 'Total of all expenses'}
                </p>
            </CardContent>
        </Card>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full sm:w-[200px]"
                />
            </div>
            <DateRangePicker 
                date={date} 
                onDateChange={(d) => { setDate(d); setActiveFilter(null); }} 
            />
            <Button variant={activeFilter === 'thisWeek' ? 'default' : 'outline'} size="sm" onClick={() => handleSetDateFilter('thisWeek')}>This Week</Button>
            <Button variant={activeFilter === 'thisMonth' ? 'default' : 'outline'} size="sm" onClick={() => handleSetDateFilter('thisMonth')}>This Month</Button>
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear
                </Button>
            )}
        </div>
        <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
        </Button>
    </div>
    {(!expenses || expenses.length === 0) ? (
        <div className="text-center py-10">
            <p className="text-muted-foreground">No expenses recorded yet.</p>
        </div>
    ) : (
      <>
        {/* Mobile View */}
        <div className="md:hidden space-y-4">
            {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                    <MobileExpenseCard 
                        key={expense.id}
                        expense={expense}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))
            ) : (
                  <div className="text-center h-24 py-10">
                    {hasActiveFilters ? `No expenses found for the selected criteria.` : `No expenses match "${searchTerm}".`}
                </div>
            )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block rounded-md border border-border/20">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredExpenses.length > 0 ? (
                        filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.name}</TableCell>
                            <TableCell>PKR {expense.amount?.toLocaleString()}</TableCell>
                            <TableCell>{expense.createdAt?.toDate ? format(expense.createdAt.toDate(), 'PPP') : 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate">{expense.notes}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the expense.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(expense.id)}>Continue</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                {hasActiveFilters ? `No expenses found for the selected criteria.` : `No expenses match "${searchTerm}".`}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </>
    )}
    <ExpenseDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={selectedExpense}
    />
    </>
  );
}
