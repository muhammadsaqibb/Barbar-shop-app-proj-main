"use client";

import { useTranslation } from "@/context/language-provider";
import { AdminPinSettings } from "@/components/admin/admin-pin-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminRoute from "@/components/admin/admin-route";

export default function SecurityPage() {
    const { t } = useTranslation();

    return (
        <AdminRoute>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Admin Protection</CardTitle>
                        <CardDescription>
                            Manage your Admin PIN and control access to sensitive features.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdminPinSettings />
                    </CardContent>
                </Card>
            </div>
        </AdminRoute>
    );
}
