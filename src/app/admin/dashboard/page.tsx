import StaffAdminRoute from "@/components/admin/staff-admin-route";
import AppointmentsTable from "@/components/admin/appointments-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
    return (
        <StaffAdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Card className="shadow-lg border-border/20">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">Bookings Dashboard</CardTitle>
                        <CardDescription>Manage all client appointments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <AppointmentsTable />
                    </CardContent>
                </Card>
            </div>
        </StaffAdminRoute>
    );
}
