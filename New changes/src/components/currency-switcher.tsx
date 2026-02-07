"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useCurrency } from '@/context/currency-provider';
import { CURRENCIES, CurrencyCode } from '@/lib/currency';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ShopSettings } from "@/types";

export function CurrencySwitcher() {
    const { currency, setCurrency } = useCurrency();
    const { firestore } = useFirebase();

    const settingsRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'shopSettings', 'config') : null),
        [firestore]
    );
    const { data: settings } = useDoc<ShopSettings>(settingsRef);

    const enabledCurrencies = settings?.currencySettings?.displayCurrencies || ['USD', 'EUR', 'GBP', 'PKR'];

    const renderCurrencyItem = (code: CurrencyCode) => (
        <DropdownMenuItem
            key={code}
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setCurrency(code)}
        >
            <div className="flex items-center gap-2">
                <span className="font-bold w-6 text-center">{CURRENCIES[code].symbol}</span>
                <div className="flex flex-col">
                    <span className="text-sm">{CURRENCIES[code].name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{code}</span>
                </div>
            </div>
            {currency === code && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2 hover:bg-primary/10 hover:text-primary transition-colors h-9">
                    <Globe className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase hidden sm:inline-block">
                        {currency}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                    {enabledCurrencies.map((code) => renderCurrencyItem(code as CurrencyCode))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
