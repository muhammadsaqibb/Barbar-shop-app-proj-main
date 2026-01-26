
import AdminRoute from "@/components/admin/admin-route";
import BarbersTable from "@/components/admin/barbers-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminBarbersPage() {
    return (
        <AdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Card className="shadow-lg border-border/20">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">Manage Barbers</CardTitle>
                        <CardDescription>Add, edit, or remove barbers from your shop.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <BarbersTable />
                    </CardContent>
                </Card>
            </div>
        </AdminRoute>
    );
}
