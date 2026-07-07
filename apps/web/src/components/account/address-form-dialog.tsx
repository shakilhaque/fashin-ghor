'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { Address } from '@ecommerce/types';
import { extractErrorMessage } from '@/contexts/auth-context';
import { useCreateAddress, useUpdateAddress } from '@/hooks/use-addresses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const addressSchema = z.object({
  label: z.string().max(50).optional().or(z.literal('')),
  recipientName: z.string().min(2, 'Enter the recipient name').max(100),
  phone: z.string().min(6, 'Enter a valid phone number').max(20),
  addressLine1: z.string().min(3, 'Enter the street address').max(200),
  addressLine2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().min(2, 'Enter the city').max(100),
  state: z.string().min(2, 'Enter the state/division').max(100),
  postalCode: z.string().min(2, 'Enter the postal code').max(20),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address;
}

export function AddressFormDialog({ open, onOpenChange, address }: AddressFormDialogProps) {
  const isEditing = Boolean(address);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({ resolver: zodResolver(addressSchema) });

  useEffect(() => {
    if (open) {
      reset({
        label: address?.label ?? '',
        recipientName: address?.recipientName ?? '',
        phone: address?.phone ?? '',
        addressLine1: address?.addressLine1 ?? '',
        addressLine2: address?.addressLine2 ?? '',
        city: address?.city ?? '',
        state: address?.state ?? '',
        postalCode: address?.postalCode ?? '',
        isDefault: address?.isDefault ?? false,
      });
    }
  }, [open, address, reset]);

  const isSubmitting = createAddress.isPending || updateAddress.isPending;

  const onSubmit = async (values: AddressFormValues) => {
    try {
      const input = {
        ...values,
        label: values.label || undefined,
        addressLine2: values.addressLine2 || undefined,
      };
      if (isEditing && address) {
        await updateAddress.mutateAsync({ id: address.id, input });
        toast.success('Address updated');
      } else {
        await createAddress.mutateAsync(input);
        toast.success('Address added');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Could not save this address'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit address' : 'Add address'}</DialogTitle>
          <DialogDescription>Used for shipping and order tracking.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" placeholder="Home" {...register('label')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient name</Label>
              <Input id="recipientName" {...register('recipientName')} />
              {errors.recipientName && (
                <p className="text-sm text-destructive">{errors.recipientName.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input id="addressLine1" {...register('addressLine1')} />
            {errors.addressLine1 && (
              <p className="text-sm text-destructive">{errors.addressLine1.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
            <Input id="addressLine2" {...register('addressLine2')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register('state')} />
              {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal code</Label>
              <Input id="postalCode" {...register('postalCode')} />
              {errors.postalCode && (
                <p className="text-sm text-destructive">{errors.postalCode.message}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="isDefault" type="checkbox" className="h-4 w-4" {...register('isDefault')} />
            <Label htmlFor="isDefault">Set as default address</Label>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add address'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
