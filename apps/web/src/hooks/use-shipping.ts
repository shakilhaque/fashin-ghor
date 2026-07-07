'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  cities: string[];
  isActive: boolean;
  createdAt: string;
  rates: ShippingRate[];
}

export interface ShippingRate {
  id: string;
  zoneId: string;
  name: string;
  minWeight: number;
  maxWeight: number | null;
  minOrderAmt: number;
  rate: number;
  isFree: boolean;
  createdAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  courier: string;
  trackingNumber: string;
  courierOrderId: string | null;
  estimatedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  events: ShipmentEvent[];
  order?: { orderNumber: string; status: string };
}

export interface ShipmentEvent {
  id: string;
  status: string;
  location: string | null;
  description: string | null;
  occurredAt: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  courier: string;
  orderNumber?: string;
  currentStatus: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  events: { status: string; location?: string; description?: string; occurredAt: string }[];
}

// ── Public ──────────────────────────────────────────────────────────────────

export function useTrackShipment(trackingNumber: string) {
  return useQuery({
    queryKey: ['track', trackingNumber],
    queryFn: async () => {
      const { data } = await api.get(`/shipping/track/${encodeURIComponent(trackingNumber)}`);
      return data.data.tracking as TrackingInfo;
    },
    enabled: trackingNumber.length >= 4,
    retry: false,
  });
}

// ── Admin — Zones ────────────────────────────────────────────────────────────

export function useAdminZones() {
  return useQuery({
    queryKey: ['admin', 'zones'],
    queryFn: async () => {
      const { data } = await api.get('/shipping/zones');
      return data.data.zones as ShippingZone[];
    },
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name: string; countries: string[]; cities?: string[]; isActive?: boolean }) => {
      const { data } = await api.post('/shipping/zones', dto);
      return data.data.zone as ShippingZone;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'zones'] }),
  });
}

export function useUpdateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; name?: string; countries?: string[]; isActive?: boolean }) => {
      const { data } = await api.patch(`/shipping/zones/${id}`, dto);
      return data.data.zone as ShippingZone;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'zones'] }),
  });
}

export function useDeleteZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/shipping/zones/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'zones'] }),
  });
}

// ── Admin — Rates ────────────────────────────────────────────────────────────

export function useCreateRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ zoneId, ...dto }: { zoneId: string; name: string; rate: number; minOrderAmt?: number; isFree?: boolean }) => {
      const { data } = await api.post(`/shipping/zones/${zoneId}/rates`, dto);
      return data.data.rate as ShippingRate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'zones'] }),
  });
}

export function useUpdateRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; name?: string; rate?: number; minOrderAmt?: number; isFree?: boolean }) => {
      const { data } = await api.patch(`/shipping/rates/${id}`, dto);
      return data.data.rate as ShippingRate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'zones'] }),
  });
}

export function useDeleteRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/shipping/rates/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'zones'] }),
  });
}

// ── Admin — Shipments ────────────────────────────────────────────────────────

export function useAdminShipments(page = 1) {
  return useQuery({
    queryKey: ['admin', 'shipments', page],
    queryFn: async () => {
      const { data } = await api.get(`/shipping/shipments?page=${page}`);
      return data as { data: { shipments: Shipment[] }; meta: { total: number; totalPages: number } };
    },
  });
}

export function useDispatchOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { orderId: string; courier: string; trackingNumber?: string; weight?: number; notes?: string }) => {
      const { data } = await api.post('/shipping/dispatch', dto);
      return data.data.shipment as Shipment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'shipments'] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}
