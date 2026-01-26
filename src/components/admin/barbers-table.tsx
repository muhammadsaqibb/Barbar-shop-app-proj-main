
"use client";

import type { Barber } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '../ui/button';
import { Edit, PlusCircle, Trash, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { BarberDialog } from './barber-dialog';
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
import { SeedBarbers } from './seed-barbers';
import { Input } from '../ui/input';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

const MobileBarberCard = ({ barber, onEdit, onDelete }: { barber: Barber, onEdit: (barber: Barber) => void, onDelete: (barberId: string) => void }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">{barber.name}</CardTitle>
            {barber.phone && <CardDescription>{barber.phone}</CardDescription>}
        </CardHeader>
        <CardFooter className="bg-muted/50 p-2 flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(barber)}>
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
                        This action cannot be undone. This will permanently delete the barber.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(barber.id)}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
    </Card>
);

export default function BarbersTable() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const barbersCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'barbers'), orderBy('name', 'asc')) : null),
    [firestore]
  );

  const { data: barbers, isLoading: loading, error, refetch } = useCollection<Barber>(barbersCollectionRef);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBarbers = useMemo(() => {
    if (!barbers) return [];
    return barbers.filter(barber => 
        barber.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [barbers, searchTerm]);

  const handleEdit = (barber: Barber) => {
    setSelectedBarber(barber);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedBarber(null);
    setDialogOpen(true);
  };

  const handleDelete = async (barberId: string) => {
    if (!firestore) return;
    const barberRef = doc(firestore, 'barbers', barberId);
    try {
        await deleteDoc(barberRef);
        toast({
            title: "Barber Deleted",
            description: "The barber has been successfully deleted.",
        });
    } catch(e) {
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: 'Could not delete the barber.',
        })
    }
  }

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

  if (!barbers || barbers.length === 0) {
    return <SeedBarbers onSeed={refetch} variant="card" />;
  }

  return (
    <>
    <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search barbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
            />
        </div>
        <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Barber
        </Button>
    </div>

    {/* Mobile View */}
    <div className="md:hidden space-y-4">
        {filteredBarbers.length > 0 ? (
            filteredBarbers.map((barber) => (
                <MobileBarberCard
                    key={barber.id}
                    barber={barber}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ))
        ) : (
              <div className="text-center h-24 py-10">No barbers found for "{searchTerm}".</div>
        )}
    </div>

    {/* Desktop View */}
    <div className="hidden md:block rounded-md border border-border/20">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredBarbers.length > 0 ? (
                    filteredBarbers.map((barber) => (
                    <TableRow key={barber.id}>
                        <TableCell className="font-medium">{barber.name}</TableCell>
                        <TableCell>{barber.phone || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(barber)}>
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
                                            This action cannot be undone. This will permanently delete the barber.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(barber.id)}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">
                            No barbers found for "{searchTerm}".
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
    <BarberDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        barber={selectedBarber}
    />
    </>
  );
}
