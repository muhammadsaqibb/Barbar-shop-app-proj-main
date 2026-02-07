import AdminRoute from "@/components/admin/admin-route";
import ShopHoursSettings from "@/components/admin/shop-hours-settings";
import ReferralSettingsForm from "@/components/admin/referral-settings-form";
import CurrencySettingsForm from "@/components/admin/currency-settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Globe } from "lucide-react";

export default function AdminSettingsPage() {
    return (
        <AdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-8 max-w-2xl mx-auto">
                    <Card className="shadow-lg border-border/20">
                        <CardHeader>
                            <CardTitle className="text-3xl font-headline flex items-center gap-3">
                                <Globe className="h-8 w-8 text-primary" />
                                Currency & Rates
                            </CardTitle>
                            <CardDescription>Configure base currency exchange rates and display options.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CurrencySettingsForm />
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-border/20">
                        <CardHeader>
                            <CardTitle className="text-3xl font-headline">Opening Hours</CardTitle>
                            <CardDescription>Manage your shop's opening and closing times.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ShopHoursSettings />
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-border/20">
                        <CardHeader>
                            <CardTitle className="text-3xl font-headline flex items-center gap-3">
                                <Gift className="h-8 w-8 text-primary" />
                                Referral & Rewards
                            </CardTitle>
                            <CardDescription>Setup your client referral program and reward values.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ReferralSettingsForm />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminRoute>
    );
}
