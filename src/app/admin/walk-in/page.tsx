"use client";

import StaffAdminRoute from "@/components/admin/staff-admin-route";
import { WalkInBookingForm } from "@/components/admin/walk-in-booking-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/context/language-provider";
import { useRouter } from "next/navigation";

export default function WalkInPage() {
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <StaffAdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex justify-center">
                <Card className="w-full max-w-2xl shadow-xl border-border/20">
                    <CardHeader className="text-center border-b mb-6 pb-6">
                        <CardTitle className="text-3xl font-headline uppercase">{t('walk_in_booking')}</CardTitle>
                        <CardDescription>{t('walk_in_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WalkInBookingForm onSuccess={() => router.push('/admin/dashboard')} />
                    </CardContent>
                </Card>
            </div>
        </StaffAdminRoute>
    );
}
