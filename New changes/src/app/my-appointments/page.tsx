
'use client';

import ProtectedRoute from "@/components/protected-route";
import AppointmentsList from "@/components/appointments/appointments-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/context/language-provider";

export default function MyAppointmentsPage() {
    const { t } = useTranslation();

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Card className="shadow-lg border-border/20">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">{t('history_title')}</CardTitle>
                        <CardDescription>{t('history_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AppointmentsList />
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
