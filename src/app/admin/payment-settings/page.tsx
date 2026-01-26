'use client';

import AdminRoute from "@/components/admin/admin-route";
import PaymentMethodsManager from "@/components/admin/payment-methods-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/context/language-provider";

export default function AdminPaymentSettingsPage() {
    const { t } = useTranslation();
    return (
        <AdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-8 max-w-4xl mx-auto">
                    <Card className="shadow-lg border-border/20">
                        <CardHeader>
                            <CardTitle className="text-3xl font-headline">{t('payment_methods_title')}</CardTitle>
                            <CardDescription>{t('payment_methods_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <PaymentMethodsManager />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminRoute>
    );
}
