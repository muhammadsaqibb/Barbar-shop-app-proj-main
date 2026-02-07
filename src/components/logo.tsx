import { Scissors } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    src?: string;
    className?: string; // Allow styling
}

const Logo = ({ src, className }: LogoProps) => {
    if (src) {
        return (
            <div className={cn("relative h-8 w-8 rounded-full overflow-hidden shrink-0 bg-white/10", className)}>
                <Image
                    src={src}
                    alt="Logo"
                    fill
                    className="object-cover"
                />
            </div>
        );
    }

    return (
        <Scissors className={cn("text-primary h-6 w-6", className)} />
    );
};

export default Logo;
