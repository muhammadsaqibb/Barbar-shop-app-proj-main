
import AdminRoute from "@/components/admin/admin-route";
import UsersTable from "@/components/admin/users-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
    return (
        <AdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Card className="shadow-lg border-border/20">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">Manage Users</CardTitle>
                        <CardDescription>View all registered users and manage their roles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <UsersTable />
                    </CardContent>
                </Card>
            </div>
        </AdminRoute>
    );
}
