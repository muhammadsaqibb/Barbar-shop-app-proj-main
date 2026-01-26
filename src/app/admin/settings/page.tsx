
import AdminRoute from "@/components/admin/admin-route";
import ShopHoursSettings from "@/components/admin/shop-hours-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
    return (
        <AdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-8 max-w-2xl mx-auto">
                    <Card className="shadow-lg border-border/20">
                        <CardHeader>
                            <CardTitle className="text-3xl font-headline">Opening Hours</CardTitle>
                            <CardDescription>Manage your shop's opening and closing times.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ShopHoursSettings />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminRoute>
    );
}
