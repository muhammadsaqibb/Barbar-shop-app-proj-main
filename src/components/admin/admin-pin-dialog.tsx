"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSaaS } from "@/context/saas-provider";
import { useToast } from "@/hooks/use-toast";
import { Lock, Delete } from "lucide-react";
import { useTranslation } from "@/context/language-provider";

interface AdminPinDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
}

export function AdminPinDialog({
    open,
    onOpenChange,
    onSuccess,
    title = "Required Admin PIN",
    description = "Please enter your 4-digit PIN to access this section."
}: AdminPinDialogProps) {
    const [pin, setPin] = useState("");
    const { currentShop } = useSaaS();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [error, setError] = useState(false);

    useEffect(() => {
        if (open) {
            setPin("");
            setError(false);
        }
    }, [open]);

    const handleNumberClick = (num: number) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            setError(false);

            if (newPin.length === 4) {
                validatePin(newPin);
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const validatePin = (inputPin: string) => {
        // If no PIN is set, allow access (or maybe prompt to set one?)
        // For now, if no PIN is set, any 4 digits work, or we block? 
        // Let's assume if no PIN is set, we treat "0000" as default or prompt user to set it first in settings.
        // Ideally, currentShop.adminPin should be checked.

        const correctPin = currentShop?.adminPin;

        if (!correctPin) {
            // If no PIN set, maybe allow plain access or use default "0000"
            if (inputPin === "0000") {
                onSuccess();
                onOpenChange(false);
            } else {
                setError(true);
                toast({
                    variant: "destructive",
                    title: "Invalid PIN",
                    description: "Default PIN is 0000. Please set a custom PIN in Settings.",
                });
                setPin("");
            }
            return;
        }

        if (inputPin === correctPin) {
            onSuccess();
            onOpenChange(false);
        } else {
            setError(true);
            setPin("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle className="text-center flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Lock className="h-5 w-5" />
                        </div>
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center my-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`h-4 w-4 rounded-full border transition-all ${pin.length > i
                                ? "bg-primary border-primary"
                                : error
                                    ? "border-destructive bg-destructive/20"
                                    : "border-primary/30"
                                }`}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-2 [&>button]:h-14 [&>button]:text-xl [&>button]:font-semibold">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <Button
                            key={num}
                            variant="outline"
                            onClick={() => handleNumberClick(num)}
                            className="hover:bg-primary/5 active:scale-95 transition-all"
                        >
                            {num}
                        </Button>
                    ))}
                    <div />
                    <Button
                        variant="outline"
                        onClick={() => handleNumberClick(0)}
                        className="hover:bg-primary/5 active:scale-95 transition-all"
                    >
                        0
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleDelete}
                        className="text-muted-foreground hover:text-destructive active:scale-95 transition-all"
                    >
                        <Delete className="h-6 w-6" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
