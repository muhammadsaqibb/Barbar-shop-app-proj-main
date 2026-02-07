"use client";

import { useAuth } from "@/components/auth-provider";
import { useSaaS } from "@/context/saas-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { useTranslation } from "@/context/language-provider";
import AdminRoute from "@/components/admin/admin-route";
import { cn } from "@/lib/utils"; // Added for cn utility

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

    return (
        <AdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-headline mb-4 uppercase">Upgrade Your Plan</h1>
                    <p className="text-muted-foreground text-lg">Choose the best plan for your growing business.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {PLANS.map((plan) => (
                        <Card key={plan.name} className={cn("flex flex-col relative", currentShop?.plan === plan.id && "ring-2 ring-primary")}>
                            {currentShop?.plan === plan.id && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Current Plan
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-2xl font-headline uppercase">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground ml-1">/ month</span>
                                </div>
                                <ul className="space-y-4">
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
        </AdminRoute>
    );
}
