import AdminRoute from "@/components/admin/admin-route";
import ServicesTable from "@/components/admin/services-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminServicesPage() {
    return (
        <AdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Card className="shadow-lg border-border/20">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">Manage Services</CardTitle>
                        <CardDescription>Add, edit, or disable services and packages.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ServicesTable />
                    </CardContent>
                </Card>
            </div>
        </AdminRoute>
    );
}
