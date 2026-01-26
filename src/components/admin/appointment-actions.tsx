
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@/types";
import { Check, X, UserX } from "lucide-react";
import { useState } from "react";
import { useFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
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
import useSound from "@/hooks/use-sound";


interface AppointmentActionsProps {
    appointmentId: string;
    currentStatus: Appointment['status'];
    onStatusChange: () => void;
}

export default function AppointmentActions({ appointmentId, currentStatus, onStatusChange }: AppointmentActionsProps) {
    const [loading, setLoading] = useState< 'confirm' | 'cancel' | 'complete' | 'no-show' | null>(null);
    const { toast } = useToast();
    const { firestore } = useFirebase();
    const playSound = useSound();

    const handleUpdateStatus = async (status: 'confirmed' | 'cancelled' | 'completed' | 'no-show') => {
        playSound('click');
        setLoading(status);
        try {
            const appointmentRef = doc(firestore, 'appointments', appointmentId);
            updateDocumentNonBlocking(appointmentRef, { status });

            toast({
                title: "Status Updated",
                description: `Appointment has been ${status === 'no-show' ? 'marked as no-show' : status}.`,
            });
            onStatusChange();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: "Could not update appointment status.",
            });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex w-full justify-end gap-2 flex-wrap">
            {currentStatus === 'pending' && (
                <>
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateStatus('confirmed')}
                        disabled={loading === 'confirm'}
                    >
                        <Check className="mr-2 h-4 w-4" />
                        {loading === 'confirm' ? 'Approving...' : 'Approve'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                            size="sm" 
                            variant="destructive"
                            disabled={loading === 'cancel'}
                             onClick={() => playSound('click')}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently cancel the appointment.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Back</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleUpdateStatus('cancelled')}>
                              {loading === 'cancel' ? 'Cancelling...' : 'Yes, cancel'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                </>
            )}
            {currentStatus === 'confirmed' && (
              <>
                 <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={loading === 'complete'}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {loading === 'complete' ? 'Completing...' : 'Mark as Completed'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => playSound('click')}>
                            <UserX className="mr-2 h-4 w-4" />
                            No Show
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will mark the client as a "no-show". This action can be reversed later if needed.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleUpdateStatus('no-show')}>
                                    {loading === 'no-show' ? 'Marking...' : 'Yes, mark as no-show'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                          size="sm" 
                          variant="destructive"
                          disabled={loading === 'cancel'}
                           onClick={() => playSound('click')}
                      >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently cancel the appointment.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Back</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => handleUpdateStatus('cancelled')}>
                            {loading === 'cancel' ? 'Cancelling...' : 'Yes, cancel'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </>
            )}
        </div>
    )
}
