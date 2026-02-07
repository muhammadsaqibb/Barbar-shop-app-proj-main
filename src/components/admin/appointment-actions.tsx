
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, AppUser, ShopSettings } from "@/types";
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
  const [loading, setLoading] = useState<'confirmed' | 'cancelled' | 'completed' | 'no-show' | null>(null);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const playSound = useSound();

  const handleUpdateStatus = async (status: 'confirmed' | 'cancelled' | 'completed' | 'no-show') => {
    playSound('click');
    setLoading(status);
    try {
      const appointmentRef = doc(firestore, 'appointments', appointmentId);
      updateDocumentNonBlocking(appointmentRef, { status });

      // Referral Logic: Trigger rewards on first completion
      if (status === 'completed') {
        try {
          // 1. Get appointment details to find the client
          const { getDoc, updateDoc, increment } = await import('firebase/firestore');
          const appointmentSnap = await getDoc(appointmentRef);
          if (appointmentSnap.exists()) {
            const appointmentData = appointmentSnap.data() as Appointment;
            const clientId = appointmentData.clientId;

            if (clientId && clientId !== 'walk-in') {
              // 2. Get client user profile
              const userRef = doc(firestore, 'users', clientId);
              const userSnap = await getDoc(userRef);

              if (userSnap.exists()) {
                const userData = userSnap.data() as AppUser;

                // 3. Check if referred and first time
                if (userData.referredBy && !userData.welcomeRewardUsed) {
                  // Fetch shop settings for reward amounts
                  const settingsRef = doc(firestore, 'shopSettings', 'config');
                  const settingsSnap = await getDoc(settingsRef);
                  const settings = settingsSnap.exists() ? settingsSnap.data() as ShopSettings : null;
                  const referralSettings = settings?.referralSettings;

                  if (referralSettings?.enabled) {
                    const referrerReward = referralSettings.referrerRewardValue || 0;
                    const welcomeReward = referralSettings.newClientRewardValue || 0;

                    // 4. Reward the Referrer
                    const referrerRef = doc(firestore, 'users', userData.referredBy);
                    await updateDoc(referrerRef, {
                      rewardBalance: increment(referrerReward),
                      'referralStats.successfulReferrals': increment(1),
                      'referralStats.totalRewardsEarned': increment(referrerReward)
                    });

                    // 5. Reward the Referred User (Welcome Reward)
                    await updateDoc(userRef, {
                      rewardBalance: increment(welcomeReward),
                      welcomeRewardUsed: true,
                      'referralStats.totalRewardsEarned': increment(welcomeReward)
                    });

                    console.log(`Referral rewards triggered: Referrer +${referrerReward}, Welcome +${welcomeReward}`);
                  }
                }
              }
            }
          }
        } catch (referralErr) {
          console.error("Error processing referral rewards:", referralErr);
          // Don't fail the main status update if referral logic fails, but log it
        }
      }

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
            disabled={loading === 'confirmed'}
          >
            <Check className="mr-2 h-4 w-4" />
            {loading === 'confirmed' ? 'Approving...' : 'Approve'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                disabled={loading === 'cancelled'}
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
                  {loading === 'cancelled' ? 'Cancelling...' : 'Yes, cancel'}
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
            disabled={loading === 'completed'}
          >
            <Check className="mr-2 h-4 w-4" />
            {loading === 'completed' ? 'Completing...' : 'Mark as Completed'}
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
                disabled={loading === 'cancelled'}
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
                  {loading === 'cancelled' ? 'Cancelling...' : 'Yes, cancel'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
