import AdminRoute from "@/components/admin/admin-route";
import ExpensesTable from "@/components/admin/expenses-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminExpensesPage() {
    return (
        <AdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Card className="shadow-lg border-border/20">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">Manage Expenses</CardTitle>
                        <CardDescription>Track all business-related expenses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ExpensesTable />
                    </CardContent>
                </Card>
            </div>
        </AdminRoute>
    );
}
