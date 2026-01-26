
"use client";

import { useState } from "react";
import { useFirebase } from "@/firebase";
import { useAuth } from "../auth-provider";
import { useToast } from "@/hooks/use-toast";
import type { AppUser, StaffPermissions } from "@/types";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface UserRoleUpdaterProps {
    user: AppUser;
}

export default function UserRoleUpdater({ user }: UserRoleUpdaterProps) {
    const { user: adminUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const handleRoleChange = async (newRole: 'client' | 'admin' | 'staff') => {
        if (!adminUser || user.uid === adminUser.uid) {
            toast({
                variant: 'destructive',
                title: 'Action Forbidden',
                description: 'You cannot change your own role.',
            });
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            
            if (newRole === 'staff' && user.role !== 'staff') {
                const defaultPermissions: StaffPermissions = {
                    canViewBookings: true,
                    canAddWalkInBookings: true,
                    canEditBookingStatus: false,
                    canManageCustomers: false,
                    canViewOverview: false,
                };
                await updateDoc(userRef, { role: newRole, permissions: defaultPermissions });
            } else if (newRole !== 'staff' && user.role === 'staff') {
                await updateDoc(userRef, { role: newRole, permissions: deleteField() });
            } else {
                await updateDoc(userRef, { role: newRole });
            }

            toast({
                title: "Role Updated",
                description: `${user.name || user.email}'s role has been updated to ${newRole}.`,
            });
        } catch (error) {
            console.error("Error updating user role:", error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the user role.',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Select 
                defaultValue={user.role} 
                onValueChange={(value: 'client' | 'admin' | 'staff') => handleRoleChange(value)}
                disabled={loading || adminUser?.uid === user.uid}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
