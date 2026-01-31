"use client";

import { useAuth } from "@/components/auth-provider";
import { useSaaS } from "@/context/saas-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { useTranslation } from "@/context/language-provider";

const PLANS = [
    {
        name: "Free",
        price: "$0",
        description: "Perfect for starting out",
        features: ["Up to 100 Customers", "Basic Booking", "Single Branch", "1 Barber"],
        limitReached: (count: number) => count >= 100,
        id: 'free'
    },
    {
        name: "Basic",
        price: "$29",
        description: "For growing shops",
        features: ["Unlimited Customers", "Multiple Barbers", "Email Notifications", "Analytics"],
        id: 'basic'
    },
    {
        name: "Pro",
        price: "$59",
        description: "Power tools for your business",
        features: ["Multiple Branches", "Inventory Management", "Marketing Tools", "Priority Support"],
        id: 'pro'
    }
];

export default function UpgradePage() {
    const { user } = useAuth();
    const { currentShop } = useSaaS();
    const { t } = useTranslation();

    if (user?.role !== 'admin') {
        return (
            <div className="container py-12 text-center text-muted-foreground">
                Access Denied. Only shop owners can access this page.
            </div>
        );
    }

    return (
        <div className="container py-12 px-4 max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold font-headline uppercase mb-4">Choose Your Plan</h1>
                <p className="text-muted-foreground text-lg">
                    Current Plan: <span className="font-bold text-primary">{currentShop?.plan?.toUpperCase() || 'FREE'}</span>
                    {currentShop?.plan === 'free' && (
                        <span className="block mt-2">({currentShop?.customerCount || 0} / 100 Customers used)</span>
                    )}
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {PLANS.map((plan) => (
                    <Card key={plan.id} className={`flex flex-col ${currentShop?.plan === plan.id ? 'ring-2 ring-primary border-primary' : ''}`}>
                        <CardHeader>
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="text-4xl font-bold mb-6">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Check className="h-4 w-4 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={currentShop?.plan === plan.id ? "ghost" : "default"}
                                disabled={currentShop?.plan === plan.id}
                            >
                                {currentShop?.plan === plan.id ? 'Current Plan' : 'Select Plan'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
