import StaffAdminRoute from "@/components/admin/staff-admin-route";
import AppointmentsTable from "@/components/admin/appointments-table";
import { WalkInBookingDialog } from "@/components/admin/walk-in-booking-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
    return (
        <StaffAdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Card className="shadow-lg border-border/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                        <div>
                            <CardTitle className="text-3xl font-headline uppercase leading-none">Bookings Dashboard</CardTitle>
                            <CardDescription className="pt-2">Manage all client appointments and walk-ins.</CardDescription>
                        </div>
                        <WalkInBookingDialog />
                    </CardHeader>
                    <CardContent>
                        <AppointmentsTable />
                    </CardContent>
                </Card>
            </div>
        </StaffAdminRoute>
    );
}
