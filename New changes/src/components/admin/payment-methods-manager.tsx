
'use client';

import { useState } from 'react';
import type { PaymentMethod } from '@/types';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/language-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, PlusCircle, Trash, Banknote, User, Hash } from 'lucide-react';
import { PaymentMethodDialog } from './payment-method-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

export default function PaymentMethodsManager() {
  const { firestore } = useFirebase();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const methodsCollectionRef = useMemoFirebase(
    () => (firestore ? collection(doc(firestore, 'shopSettings', 'config'), 'paymentMethods') : null),
    [firestore]
  );
  const { data: methods, isLoading } = useCollection<PaymentMethod>(methodsCollectionRef);

  const handleAdd = () => {
    setSelectedMethod(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setIsDialogOpen(true);
  };

  const handleDelete = (methodId: string) => {
    if (!methodsCollectionRef) return;
    deleteDocumentNonBlocking(doc(methodsCollectionRef, methodId));
    toast({ title: t('method_deleted_success_title') });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2" />
          {t('add_method_button')}
        </Button>
      </div>

      {methods && methods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((method) => (
            <Card key={method.id}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Banknote /> {method.methodName}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                        <User className="text-muted-foreground" />
                        <span>{method.accountHolderName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Hash className="text-muted-foreground" />
                        <span className="font-mono">{method.accountNumber}</span>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-2 flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(method)}>
                        <Edit />
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this payment method.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(method.id)}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">{t('no_payment_methods')}</p>
        </div>
      )}

      <PaymentMethodDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        method={selectedMethod}
      />
    </div>
  );
}
