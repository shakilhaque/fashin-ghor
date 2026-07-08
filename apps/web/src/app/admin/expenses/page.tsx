'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Plus, Pencil, Trash2, Receipt, TrendingDown,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUploader } from '@/components/admin/image-uploader';
import { formatPrice, cn } from '@/lib/utils';

const CATEGORIES = [
  'INVENTORY', 'SHIPPING', 'MARKETING', 'SALARIES',
  'RENT', 'UTILITIES', 'SOFTWARE', 'RETURNS', 'MISCELLANEOUS',
] as const;

type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<Category, string> = {
  INVENTORY: 'bg-blue-100 text-blue-700',
  SHIPPING: 'bg-teal-100 text-teal-700',
  MARKETING: 'bg-pink-100 text-pink-700',
  SALARIES: 'bg-amber-100 text-amber-700',
  RENT: 'bg-orange-100 text-orange-700',
  UTILITIES: 'bg-cyan-100 text-cyan-700',
  SOFTWARE: 'bg-purple-100 text-purple-700',
  RETURNS: 'bg-rose-100 text-rose-700',
  MISCELLANEOUS: 'bg-zinc-100 text-zinc-600',
};

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  description?: string;
  receiptUrl?: string;
  date: string;
  createdAt: string;
}

interface ExpenseForm {
  title: string;
  amount: string;
  category: Category;
  description: string;
  receiptUrl: string;
  date: string;
}

const emptyForm = (): ExpenseForm => ({
  title: '',
  amount: '',
  category: 'MISCELLANEOUS',
  description: '',
  receiptUrl: '',
  date: new Date().toISOString().slice(0, 10),
});

function expenseToForm(e: Expense): ExpenseForm {
  return {
    title: e.title,
    amount: String(e.amount),
    category: e.category,
    description: e.description ?? '',
    receiptUrl: e.receiptUrl ?? '',
    date: e.date.slice(0, 10),
  };
}

function useExpenses(page: number, category?: Category) {
  return useQuery({
    queryKey: ['admin', 'expenses', page, category],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (category) params.set('category', category);
      const { data } = await api.get(`/expenses?${params}`);
      return data.data as {
        expenses: Expense[];
        total: number;
        totalAmount: number;
        totalPages: number;
      };
    },
  });
}

export default function AdminExpensesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<Category | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());

  const { data, isLoading } = useExpenses(page, filterCategory);

  const createMutation = useMutation({
    mutationFn: async (payload: object) => {
      await api.post('/expenses', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'expenses'] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & object) => {
      await api.patch(`/expenses/${id}`, payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'expenses'] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/expenses/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'expenses'] }),
  });

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(e: Expense) {
    setEditTarget(e);
    setForm(expenseToForm(e));
    setDialogOpen(true);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const payload = {
      title: form.title,
      amount: Number(form.amount),
      category: form.category,
      description: form.description || undefined,
      receiptUrl: form.receiptUrl || undefined,
      date: new Date(form.date).toISOString(),
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const expenses = data?.expenses ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track business costs and overheads</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Total (this page)</span>
          </div>
          <p className="font-display text-2xl font-bold text-rose-600">
            {formatPrice(data?.totalAmount ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Entries</p>
          <p className="font-display text-2xl font-bold">{data?.total ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">This Page</p>
          <p className="font-display text-2xl font-bold">{expenses.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setFilterCategory(undefined); setPage(1); }}
          className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', !filterCategory ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setFilterCategory(cat); setPage(1); }}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', filterCategory === cat ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
          >
            {cat.charAt(0) + cat.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-secondary" /></td></tr>
                ))
              : expenses.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No expenses yet. Click "Add Expense" to get started.</td></tr>
                )
              : expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {exp.receiptUrl && <Receipt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                        <div>
                          <p className="font-medium">{exp.title}</p>
                          {exp.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{exp.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', CATEGORY_COLORS[exp.category])}>
                        {exp.category.charAt(0) + exp.category.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-600">
                      -{formatPrice(exp.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(exp)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this expense?')) deleteMutation.mutate(exp.id); }}
                          disabled={deleteMutation.isPending}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</p>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Monthly server hosting" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (৳) *</Label>
                <Input required type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="mt-1" />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Additional notes…" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <Label>Receipt Image (optional)</Label>
              <div className="mt-1">
                <ImageUploader
                  value={form.receiptUrl}
                  onChange={(url) => setForm((f) => ({ ...f, receiptUrl: url }))}
                  folder="banners"
                  label="Upload Receipt"
                  aspect="auto"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Expense'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
