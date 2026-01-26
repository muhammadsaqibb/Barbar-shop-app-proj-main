"use client";

import { useState } from "react";
import { useFirebase, updateDocumentNonBlocking } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { doc } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Appointment } from "@/types";

interface PaymentStatusUpdaterProps {
    appointment: Appointment;
}

export default function PaymentStatusUpdater({ appointment }: PaymentStatusUpdaterProps) {
    const [loading, setLoading] = useState(false);
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const handleStatusChange = async (newStatus: 'paid' | 'unpaid') => {
        if (!firestore) return;
        setLoading(true);
        try {
            const appointmentRef = doc(firestore, 'appointments', appointment.id);
            updateDocumentNonBlocking(appointmentRef, { paymentStatus: newStatus });
            toast({
                title: "Payment Status Updated",
                description: `Appointment marked as ${newStatus}.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update payment status.',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Select 
                defaultValue={appointment.paymentStatus} 
                onValueChange={(value: 'paid' | 'unpaid') => handleStatusChange(value)}
                disabled={loading}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
