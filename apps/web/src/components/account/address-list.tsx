'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Address } from '@ecommerce/types';
import { extractErrorMessage } from '@/contexts/auth-context';
import { useAddresses, useDeleteAddress } from '@/hooks/use-addresses';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AddressFormDialog } from './address-form-dialog';

export function AddressList() {
  const { data: addresses, isLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(undefined);

  const openCreateDialog = () => {
    setEditingAddress(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      toast.success('Address deleted');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not delete this address'));
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Addresses</CardTitle>
          <CardDescription>Manage your shipping addresses.</CardDescription>
        </div>
        <Button onClick={openCreateDialog}>Add address</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading addresses…</p>}
        {!isLoading && addresses?.length === 0 && (
          <p className="text-sm text-muted-foreground">You haven&apos;t added any addresses yet.</p>
        )}
        {addresses?.map((address) => (
          <div
            key={address.id}
            className="flex items-start justify-between rounded-xl border border-border p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{address.label}</p>
                {address.isDefault && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {address.recipientName} · {address.phone}
              </p>
              <p className="text-sm text-muted-foreground">
                {address.addressLine1}
                {address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city},{' '}
                {address.state} {address.postalCode}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEditDialog(address)}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(address.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
      <AddressFormDialog open={dialogOpen} onOpenChange={setDialogOpen} address={editingAddress} />
    </Card>
  );
}
