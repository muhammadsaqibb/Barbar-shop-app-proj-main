"use client";

import { useAuth } from "@/components/auth-provider";
import BookingForm from "@/components/appointments/booking-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProtectedRoute from "@/components/protected-route";
import { useTranslation } from "@/context/language-provider";

export default function PackagesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <ProtectedRoute>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
                <Card className="shadow-lg border-border/20">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline text-center uppercase">
                    {t('our_packages_title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground mb-6">
                    {t('our_packages_desc')}
                    </p>
                    <BookingForm showPackagesOnly={true} />
                </CardContent>
                </Card>
            </div>
        </div>
    </ProtectedRoute>
  );
}
