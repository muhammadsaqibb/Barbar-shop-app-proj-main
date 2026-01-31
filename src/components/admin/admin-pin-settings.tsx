"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSaaS } from "@/context/saas-provider";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/context/language-provider";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { ProtectedAction } from "@/components/admin/protected-action";

import { Switch } from "@/components/ui/switch";

export function AdminPinSettings() {
    const { currentShop, loading: saasLoading } = useSaaS();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [pin, setPin] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [hasChanged, setHasChanged] = useState(false);

    useEffect(() => {
        if (currentShop?.adminPin && !hasChanged) {
            setPin(currentShop.adminPin);
        }
    }, [currentShop?.adminPin, hasChanged]);

    const handlePinChange = (val: string) => {
        const cleaned = val.replace(/\D/g, '').slice(0, 4);
        setPin(cleaned);
        setHasChanged(true);
    };

    const handleLockToggle = async (infoKey: string, isLocked: boolean) => {
        if (!currentShop?.id) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Shop ID not found. Please refresh the page.',
            });
            return;
        }

        try {
            const shopRef = doc(firestore, 'shops', currentShop.id);
            // Updating specific field in the object
            await updateDoc(shopRef, {
                [`featureLocks.${infoKey}`]: isLocked
            });
            toast({
                title: isLocked ? 'Feature Locked' : 'Feature Unlocked',
                description: `${FEATURE_LABELS[infoKey]} has been updated.`,
            });
        } catch (error: any) {
            console.error("Error updating locks:", error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update lock settings.'
            });
        }
    };

    const handleSave = async (e?: React.SyntheticEvent) => {
        if (e) e.preventDefault();

        if (!currentShop?.id) {
            toast({ variant: 'destructive', title: 'Error', description: 'Shop ID missing.' });
            return;
        }

        if (pin.length !== 4) {
            toast({
                variant: 'destructive',
                title: 'Invalid PIN',
                description: 'PIN must be exactly 4 digits.',
            });
            return;
        }

        setIsSaving(true);
        try {
            console.log("Saving PIN for shop:", currentShop.id, "PIN:", pin);
            const shopRef = doc(firestore, 'shops', currentShop.id);
            await updateDoc(shopRef, {
                adminPin: pin
            });

            toast({
                title: 'Success!',
                description: 'Admin PIN has been saved successfully.',
            });
            setHasChanged(false);
        } catch (error: any) {
            console.error("Error updating PIN:", error);
            toast({
                variant: 'destructive',
                title: 'Saving Failed',
                description: error.message || 'Could not save PIN. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (saasLoading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!currentShop) {
        return (
            <div className="p-6 border border-amber-200 bg-amber-50 rounded-xl text-amber-800">
                <h3 className="font-bold text-lg mb-2">Shop Settings Not Loaded</h3>
                <p className="text-sm mb-4">
                    We're having trouble identifying your shop. This can happen if:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 mb-4">
                    <li>Your account isn't linked to a shop yet</li>
                    <li>The shop document was deleted</li>
                    <li>There's a temporary connection issue with the database</li>
                </ul>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Refresh Page
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Lock className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-bold">Admin Security PIN</h3>
                </div>
                <p className="text-sm text-muted-foreground max-w-lg">
                    This PIN protects sensitive areas from unauthorized access.
                    Default PIN is not set. Please set a 4-digit numeric PIN.
                </p>

                <div className="flex items-end gap-3 max-w-sm">
                    <div className="flex-1 space-y-2">
                        <div className="relative">
                            <Input
                                type={showPin ? "text" : "password"}
                                value={pin}
                                onChange={(e) => handlePinChange(e.target.value)}
                                placeholder="4-digit PIN"
                                maxLength={4}
                                className="font-mono text-xl tracking-[1em] text-center h-12"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPin(!showPin)}
                            >
                                {showPin ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <ProtectedAction
                        bypass={!currentShop?.adminPin || pin === currentShop.adminPin}
                    >
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || pin.length !== 4 || (!hasChanged && !!currentShop?.adminPin)}
                            className="h-12 px-6 font-bold"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save PIN'}
                        </Button>
                    </ProtectedAction>
                </div>
            </div>

            <div className="pt-6 border-t">
                <div className="flex items-center space-x-2 mb-4">
                    <Lock className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">Manage Feature Locks</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                    Choose which screens require the Admin PIN. Features not selected can be accessed freely by staff.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                        const isLocked = currentShop?.featureLocks?.[key] === true;
                        return (
                            <div key={key} className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
                                <div className="space-y-0.5">
                                    <span className="font-semibold">{label}</span>
                                    <p className="text-[10px] text-muted-foreground">
                                        {isLocked ? 'Currently Locked' : 'Open Access'}
                                    </p>
                                </div>
                                <Switch
                                    checked={isLocked}
                                    onCheckedChange={(checked) => handleLockToggle(key, checked)}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const FEATURE_LABELS: Record<string, string> = {
    'overview': 'Overview & Stats',
    'bookings': 'Bookings List',
    'manage_users': 'Manage Users',
    'manage_barbers': 'Manage Barbers',
    'manage_services': 'Manage Services & Prices',
    'manage_expenses': 'Manage Expenses',
    'opening_hours': 'Opening Hours',
    'payment_settings': 'Payment Settings',
};
