"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/context/language-provider";
import { useCurrency } from "@/context/currency-provider";
import { Gift, Copy, Check, Share2, Users, Scissors, Star } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ReferralsPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { formatPrice } = useCurrency();
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    if (!user) {
        return (
            <div className="container mx-auto p-4 text-center mt-20">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p>Please log in to view your referral rewards.</p>
            </div>
        );
    }

    const referralCode = user.referralCode || "B-FRESH-2024"; // Fallback for safety
    const shareUrl = `${window.location.origin}/register?ref=${referralCode}`;
    const shareText = `Get a fresh haircut with a discount! Use my referral code ${referralCode} when you sign up at The Gentlemen's Cut: ${shareUrl}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        toast({
            title: t('code_copied'),
            duration: 2000,
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full text-primary mb-2">
                    <Gift className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-headline uppercase tracking-tight">{t('refer_and_earn')}</h1>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                    {t('referral_desc')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Referral Code Card */}
                <Card className="md:col-span-2 overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5 relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Scissors className="h-24 w-24 rotate-12" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            {t('referral_code_label')}
                        </CardTitle>
                        <CardDescription>Share this code with your friends to unlock rewards.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/30 rounded-2xl bg-background/50 backdrop-blur-sm">
                            <span className="text-5xl font-black tracking-widest text-primary mb-6 font-mono">
                                {referralCode}
                            </span>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Button size="lg" onClick={copyToClipboard} className="font-bold flex gap-2 min-w-[140px]">
                                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                    {copied ? "Copied!" : t('copy_code')}
                                </Button>
                                <Button size="lg" variant="outline" onClick={shareWhatsApp} className="font-bold flex gap-2 min-w-[140px] border-primary/50 hover:bg-primary/10">
                                    <Share2 className="h-5 w-5" />
                                    {t('share_whatsapp')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Card */}
                <div className="space-y-6">
                    <Card className="border-border/30 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardDescription className="uppercase tracking-wider text-[10px] font-bold">Total Earned</CardDescription>
                            <CardTitle className="text-3xl text-emerald-500">{formatPrice(user.referralStats?.totalRewardsEarned || 0)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[60%]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/30 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardDescription className="uppercase tracking-wider text-[10px] font-bold">Pending Rewards</CardDescription>
                            <CardTitle className="text-3xl text-primary">{formatPrice(user.rewardBalance || 0)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[30%]" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/30 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardDescription className="uppercase tracking-wider text-[10px] font-bold">Successful Referrals</CardDescription>
                            <CardTitle className="text-3xl text-foreground">{user.referralStats?.successfulReferrals || 0}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            </div>

            {/* How it Works Section */}
            <div className="pt-8">
                <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center space-y-4 p-6 bg-card rounded-2xl border border-border/20">
                        <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Share2 className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold text-lg">1. Share Code</h3>
                        <p className="text-sm text-muted-foreground">Send your unique code to friends and family.</p>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4 p-6 bg-card rounded-2xl border border-border/20">
                        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Scissors className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold text-lg">2. Friend Books</h3>
                        <p className="text-sm text-muted-foreground">Your friend signs up and completes their first paid booking.</p>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4 p-6 bg-card rounded-2xl border border-border/20">
                        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Gift className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold text-lg">3. Both Earn</h3>
                        <p className="text-sm text-muted-foreground">You both receive a discount reward for your next visits!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
