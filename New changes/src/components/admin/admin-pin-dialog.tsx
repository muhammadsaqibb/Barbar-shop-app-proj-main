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
import useSound from "@/hooks/use-sound";

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
    const playSound = useSound();
    const [error, setError] = useState(false);

    // Lockout logic
    const [attempts, setAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const savedLockout = localStorage.getItem('admin_pin_lockout');
        const savedAttempts = localStorage.getItem('admin_pin_attempts');

        if (savedLockout) {
            const expiry = parseInt(savedLockout, 10);
            if (Date.now() < expiry) {
                setLockoutTime(expiry);
                setTimeLeft(Math.ceil((expiry - Date.now()) / 1000));
            } else {
                localStorage.removeItem('admin_pin_lockout');
                localStorage.setItem('admin_pin_attempts', '0');
            }
        }

        if (savedAttempts) {
            setAttempts(parseInt(savedAttempts, 10));
        }
    }, [open]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (lockoutTime && timeLeft > 0) {
            timer = setInterval(() => {
                const newTime = Math.ceil((lockoutTime - Date.now()) / 1000);
                if (newTime <= 0) {
                    setLockoutTime(null);
                    setTimeLeft(0);
                    setAttempts(0);
                    localStorage.removeItem('admin_pin_lockout');
                    localStorage.setItem('admin_pin_attempts', '0');
                    clearInterval(timer);
                } else {
                    setTimeLeft(newTime);
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [lockoutTime, timeLeft]);

    useEffect(() => {
        if (open) {
            setPin("");
            setError(false);
        }
    }, [open]);

    const handleNumberClick = (num: number) => {
        if (lockoutTime) return;
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
        if (lockoutTime) return;
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const validatePin = (inputPin: string) => {
        const correctPin = currentShop?.adminPin || "0000"; // Default "0000" if none set

        if (inputPin === correctPin) {
            setAttempts(0);
            localStorage.setItem('admin_pin_attempts', '0');
            playSound('access-granted');
            onSuccess();
            onOpenChange(false);
        } else {
            setError(true);
            setPin("");

            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            localStorage.setItem('admin_pin_attempts', newAttempts.toString());

            if (newAttempts >= 3) {
                const lockoutExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
                setLockoutTime(lockoutExpiry);
                setTimeLeft(300);
                localStorage.setItem('admin_pin_lockout', lockoutExpiry.toString());
                toast({
                    variant: "destructive",
                    title: "Security Lockout",
                    description: "Too many failed attempts. Try again in 5 minutes.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Incorrect PIN",
                    description: `You have ${3 - newAttempts} attempts remaining.`,
                });
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle className="text-center flex flex-col items-center gap-2">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${lockoutTime ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                            <Lock className="h-5 w-5" />
                        </div>
                        {lockoutTime ? "Security Lockout" : title}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {lockoutTime
                            ? `Too many failed attempts. Please wait ${formatTime(timeLeft)} before trying again.`
                            : description}
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

                <div className={`grid grid-cols-3 gap-2 [&>button]:h-14 [&>button]:text-xl [&>button]:font-semibold ${lockoutTime ? 'opacity-50 pointer-events-none' : ''}`}>
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

                {!lockoutTime && attempts > 0 && (
                    <p className="text-center text-xs text-destructive font-medium animate-pulse">
                        {3 - attempts} attempts remaining
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
