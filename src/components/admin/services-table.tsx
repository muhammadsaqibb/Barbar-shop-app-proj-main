
"use client";

import type { Service } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Edit, PlusCircle, Trash, Search, Users } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ServiceDialog } from './service-dialog';
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
import { SeedServices } from './seed-services';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

const MobileServiceCard = ({ service, onToggle, onEdit, onDelete }: { service: Service, onToggle: (service: Service) => void, onEdit: (service: Service) => void, onDelete: (serviceId: string) => void }) => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <Switch
                    checked={service.enabled}
                    onCheckedChange={() => onToggle(service)}
                    aria-label="Toggle service enabled state"
                />
            </div>
            <CardDescription>
                <Badge variant={service.isPackage ? "default" : "secondary"}>
                    {service.isPackage ? "Package" : "Service"}
                </Badge>
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                {service.discountedPrice && service.discountedPrice > 0 ? (
                    <div className="flex flex-col items-end">
                        <span className="line-through text-muted-foreground text-xs">PKR {service.price?.toLocaleString()}</span>
                        <span className="font-bold">PKR {service.discountedPrice?.toLocaleString()}</span>
                    </div>
                ) : (
                    <span className="font-bold">PKR {service.price?.toLocaleString()}</span>
                )}
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{service.duration} min</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Max Pax:</span>
                 <Badge variant="secondary" className="flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    <span>Up to {service.maxQuantity || 50}</span>
                </Badge>
            </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-2 flex justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(service)}>
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
                        This action cannot be undone. This will permanently delete the service.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(service.id)}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
    </Card>
);

export default function ServicesTable() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const servicesCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'services'), orderBy('name', 'asc')) : null),
    [firestore]
  );

  const { data: services, isLoading: loading, error, refetch } = useCollection<Service>(servicesCollectionRef);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedService(null);
    setDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!firestore) return;
    const serviceRef = doc(firestore, 'services', serviceId);
    try {
        await deleteDoc(serviceRef);
        toast({
            title: "Service Deleted",
            description: "The service has been successfully deleted.",
        });
    } catch(e) {
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: 'Could not delete the service.',
        })
    }
  }

  const handleToggleEnabled = (service: Service) => {
    if (!firestore) return;
    const serviceRef = doc(firestore, 'services', service.id);
    updateDocumentNonBlocking(serviceRef, { enabled: !service.enabled });
  };

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

  if (!services || services.length === 0) {
    return <SeedServices onSeed={refetch} variant="card" />;
  }

  return (
    <>
    <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
            />
        </div>
        <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Service
        </Button>
    </div>

    {/* Mobile View */}
    <div className="md:hidden space-y-4">
        {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
                <MobileServiceCard 
                    key={service.id}
                    service={service}
                    onToggle={handleToggleEnabled}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ))
        ) : (
            <div className="text-center h-24 py-10">No services found for "{searchTerm}".</div>
        )}
    </div>

    {/* Desktop View */}
    <div className="hidden md:block rounded-md border border-border/20">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Max Pax</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                    <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                            {service.discountedPrice && service.discountedPrice > 0 ? (
                                <div className="flex flex-col">
                                    <span className="line-through text-muted-foreground text-xs">PKR {service.price?.toLocaleString()}</span>
                                    <span className="font-bold">PKR {service.discountedPrice?.toLocaleString()}</span>
                                </div>
                            ) : (
                                `PKR ${service.price?.toLocaleString()}`
                            )}
                        </TableCell>
                        <TableCell>{service.duration} min</TableCell>
                        <TableCell>
                            <Badge variant={service.isPackage ? "default" : "secondary"}>
                                {service.isPackage ? "Package" : "Service"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                           <Badge variant="secondary" className="flex items-center gap-1.5">
                                <Users className="h-3 w-3" />
                                <span>Up to {service.maxQuantity || 50}</span>
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Switch
                                checked={service.enabled}
                                onCheckedChange={() => handleToggleEnabled(service)}
                                aria-label="Toggle service enabled state"
                            />
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
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
                                            This action cannot be undone. This will permanently delete the service.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(service.id)}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                            No services found for "{searchTerm}".
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
    <ServiceDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        service={selectedService}
    />
    </>
  );
}
