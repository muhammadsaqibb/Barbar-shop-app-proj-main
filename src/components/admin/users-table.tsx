
"use client";

import { useState } from 'react';
import type { AppUser } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import UserRoleUpdater from './user-role-updater';
import { Button } from '../ui/button';
import { Edit, Settings } from 'lucide-react';
import { StaffPermissionsDialog } from './staff-permissions-dialog';
import { UserEditDialog } from './user-edit-dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

const MobileUserCard = ({ user, onEdit, onManagePermissions }: { user: AppUser, onEdit: (user: AppUser) => void, onManagePermissions: (user: AppUser) => void }) => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </div>
                 <Badge variant={user.enabled !== false ? 'default' : 'destructive'}>
                    {user.enabled !== false ? 'Active' : 'Disabled'}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
             <div>
                <h4 className="text-sm font-semibold mb-2">Role</h4>
                <UserRoleUpdater user={user} />
            </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-2 flex justify-end gap-2">
            {user.role === 'staff' && (
                <Button variant="outline" size="sm" onClick={() => onManagePermissions(user)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Permissions
                </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit User</span>
            </Button>
        </CardFooter>
    </Card>
);

export default function UsersTable() {
  const { firestore } = useFirebase();

  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  const handleManagePermissions = (user: AppUser) => {
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
  };
  
  const handleEditUser = (user: AppUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('name', 'asc')) : null),
    [firestore]
  );

  const { data: users, isLoading: loading, error } = useCollection<AppUser>(usersCollectionRef);

  if (loading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  if (error) {
    return <p className="text-destructive text-center">{error.message}</p>;
  }

  if (!users || users.length === 0) {
    return <p className="text-muted-foreground text-center">There are no registered users.</p>;
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
          {users.map((user) => (
              <MobileUserCard
                  key={user.id}
                  user={user}
                  onEdit={handleEditUser}
                  onManagePermissions={handleManagePermissions}
              />
          ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-md border border-border/20">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={user.enabled !== false ? 'default' : 'destructive'}>
                            {user.enabled !== false ? 'Active' : 'Disabled'}
                        </Badge>
                    </TableCell>
                    <TableCell className="w-[180px]">
                      <UserRoleUpdater user={user} />
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                        {user.role === 'staff' && (
                            <Button variant="outline" size="sm" onClick={() => handleManagePermissions(user)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Permissions
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit User</span>
                        </Button>
                        </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
      <StaffPermissionsDialog 
          isOpen={permissionsDialogOpen}
          onOpenChange={setPermissionsDialogOpen}
          user={selectedUser}
      />
      <UserEditDialog
          isOpen={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
      />
    </>
  );
}
