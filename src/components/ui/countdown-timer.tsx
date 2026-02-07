"use client";

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
    createdAt: any;
    expiresInMinutes?: number;
    className?: string;
    onExpire?: () => void;
}

export const CountdownTimer = ({ createdAt, expiresInMinutes = 2, className, onExpire }: CountdownTimerProps) => {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!createdAt) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            let createdTime: Date;

            if (createdAt?.toDate) {
                createdTime = createdAt.toDate();
            } else if (createdAt?.seconds) {
                createdTime = new Date(createdAt.seconds * 1000);
            } else if (typeof createdAt === 'string') {
                createdTime = new Date(createdAt);
            } else if (createdAt instanceof Date) {
                createdTime = createdAt;
            } else {
                return null;
            }

            const expireTime = new Date(createdTime.getTime() + expiresInMinutes * 60000);
            const diff = expireTime.getTime() - now.getTime();

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft("00:00");
                if (onExpire) onExpire();
                return null;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        // Initial calc
        const initial = calculateTimeLeft();
        if (initial) setTimeLeft(initial);

        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            if (left) {
                setTimeLeft(left);
            } else {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [createdAt, expiresInMinutes, onExpire]);

    if (isExpired) return null;
    if (!timeLeft) return null;

    return (
        <span className={cn("inline-flex items-center gap-1 text-orange-500 font-mono font-bold text-xs animate-pulse", className)}>
            <Clock className="h-3 w-3" />
            {timeLeft}
        </span>
    );
};
