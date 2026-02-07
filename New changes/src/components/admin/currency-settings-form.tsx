"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { ShopSettings, CurrencySettings } from '@/types';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, Globe, TrendingUp } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { CURRENCIES, CurrencyCode } from '@/lib/currency';
import { Checkbox } from '@/components/ui/checkbox';

const currencySchema = z.object({
    rates: z.record(z.string(), z.number().min(0.000001)),
    displayCurrencies: z.array(z.string()),
});

export default function CurrencySettingsForm() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const settingsRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'shopSettings', 'config') : null),
        [firestore]
    );
    const { data: settings, isLoading: settingsLoading } = useDoc<ShopSettings>(settingsRef);

    const form = useForm<z.infer<typeof currencySchema>>({
        resolver: zodResolver(currencySchema),
        defaultValues: {
            rates: {},
            displayCurrencies: ['USD', 'EUR', 'GBP', 'PKR'],
        },
    });

    useEffect(() => {
        if (settings?.currencySettings) {
            form.reset({
                rates: settings.currencySettings.rates || {},
                displayCurrencies: settings.currencySettings.displayCurrencies || ['USD', 'EUR', 'GBP', 'PKR'],
            });
        }
    }, [settings, form]);

    const onSubmit = async (values: z.infer<typeof currencySchema>) => {
        if (!settingsRef) return;
        setIsSubmitting(true);
        try {
            await setDoc(settingsRef, {
                currencySettings: {
                    baseCurrency: 'PKR',
                    ...values
                }
            }, { merge: true });
            toast({
                title: 'Currency Settings Updated',
                description: 'Exchange rates and display preferences have been saved.',
            });
        } catch (error) {
            console.error('Failed to update currency settings:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'An error occurred while saving the currency settings.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (settingsLoading) {
        return <Skeleton className="h-60 w-full" />;
    }

    const availableCurrencies = Object.keys(CURRENCIES) as CurrencyCode[];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <h3 className="font-bold uppercase tracking-tight">Main Configuration</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        The base currency is locked to <strong>PKR</strong>. All transactions are stored in PKR and converted using the rates below.
                    </p>

                    <div className="space-y-4">
                        <FormLabel className="text-base font-bold">Enabled Currencies</FormLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {availableCurrencies.map((code) => (
                                <FormField
                                    key={code}
                                    control={form.control}
                                    name="displayCurrencies"
                                    render={({ field }) => (
                                        <div className="flex items-center space-x-2 bg-background p-2 rounded border border-border/50">
                                            <Checkbox
                                                id={`check-${code}`}
                                                checked={field.value.includes(code)}
                                                onCheckedChange={(checked) => {
                                                    const current = [...field.value];
                                                    if (checked) {
                                                        field.onChange([...current, code]);
                                                    } else if (code !== 'PKR') { // Prevent disabling base currency
                                                        field.onChange(current.filter(c => c !== code));
                                                    }
                                                }}
                                                disabled={code === 'PKR'}
                                            />
                                            <label htmlFor={`check-${code}`} className="text-xs font-medium uppercase cursor-pointer">
                                                {code} ({CURRENCIES[code].symbol})
                                            </label>
                                        </div>
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.watch('displayCurrencies')
                        .filter(code => code !== 'PKR')
                        .map((code) => (
                            <Card key={code} className="border-border/50">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                                        <span>{CURRENCIES[code as CurrencyCode].name} ({code})</span>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <FormField
                                        control={form.control}
                                        name={`rates.${code}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Exchange Rate (1 {code} = ? PKR)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">PKR</span>
                                                        <Input
                                                            type="number"
                                                            step="0.000001"
                                                            placeholder="280.00"
                                                            {...field}
                                                            onChange={e => field.onChange(Number(e.target.value))}
                                                            className="pl-12 text-sm font-bold"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        ))}
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting} className="font-bold">
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Currency Configuration'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
