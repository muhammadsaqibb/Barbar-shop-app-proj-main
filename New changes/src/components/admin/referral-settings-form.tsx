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
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { ShopSettings, ReferralSettings } from '@/types';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { Loader2, Gift, Users, Trophy } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useCurrency } from '@/context/currency-provider';

const referralSchema = z.object({
    enabled: z.boolean(),
    referrerRewardValue: z.number().min(0),
    newClientRewardValue: z.number().min(0),
});

export default function ReferralSettingsForm() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const { getCurrencySymbol } = useCurrency();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const settingsRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'shopSettings', 'config') : null),
        [firestore]
    );
    const { data: settings, isLoading: settingsLoading } = useDoc<ShopSettings>(settingsRef);

    const form = useForm<z.infer<typeof referralSchema>>({
        resolver: zodResolver(referralSchema),
        defaultValues: {
            enabled: false,
            referrerRewardValue: 50,
            newClientRewardValue: 30,
        },
    });

    useEffect(() => {
        if (settings?.referralSettings) {
            form.reset({
                enabled: settings.referralSettings.enabled,
                referrerRewardValue: settings.referralSettings.referrerRewardValue,
                newClientRewardValue: settings.referralSettings.newClientRewardValue,
            });
        }
    }, [settings, form]);

    const onSubmit = async (values: z.infer<typeof referralSchema>) => {
        if (!settingsRef) return;
        setIsSubmitting(true);
        try {
            await setDoc(settingsRef, {
                referralSettings: {
                    ...values,
                    referrerRewardType: 'fixed',
                    newClientRewardType: 'fixed',
                    oneTimeOnly: true,
                }
            }, { merge: true });
            toast({
                title: 'Settings Updated',
                description: 'Referral program settings have been successfully updated.',
            });
        } catch (error) {
            console.error('Failed to update referral settings:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'An error occurred while saving the referral settings.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (settingsLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-accent/5">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base font-bold">Enable Referral Program</FormLabel>
                        <FormDescription>
                            Allow clients to refer friends and earn rewards.
                        </FormDescription>
                    </div>
                    <FormField
                        control={form.control}
                        name="enabled"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-emerald-500/20 bg-emerald-500/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-emerald-500" />
                                Referrer Reward (Existing Client)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="referrerRewardValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{getCurrencySymbol()}</span>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                    className="pl-12 font-bold"
                                                    disabled={!form.watch('enabled')}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-[10px]">
                                            Amount credited to the person who shared the code.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-blue-500/20 bg-blue-500/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Gift className="h-4 w-4 text-blue-500" />
                                New Client Reward (Welcome)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="newClientRewardValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{getCurrencySymbol()}</span>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                    className="pl-12 font-bold"
                                                    disabled={!form.watch('enabled')}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription className="text-[10px]">
                                            Amount credited to the friend on their FIRST booking.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting} className="font-bold">
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Referral Configuration'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
