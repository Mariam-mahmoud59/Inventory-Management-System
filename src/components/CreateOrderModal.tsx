import * as React from 'react';
import { X, Loader2, PackagePlus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dictCreateOrder } from '@/api/orders';
import { fetchBranches } from '@/api/branches';
import { fetchProducts } from '@/api/products';
import { cn } from '@/lib/utils';

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface LineItem {
    product_id: string;
    quantity: number;
    unit_price: number;
}

export function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
    const queryClient = useQueryClient();

    const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });
    const { data: products } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });

    const [orderType, setOrderType] = React.useState<'purchase' | 'sale'>('purchase');
    const [branchId, setBranchId] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [items, setItems] = React.useState<LineItem[]>([{ product_id: '', quantity: 1, unit_price: 0 }]);

    const mutation = useMutation({
        mutationFn: dictCreateOrder,
        onSuccess: () => {
            toast.success('Order created successfully!');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            onClose();
            // Reset
            setItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
            setBranchId('');
            setNotes('');
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail;
            toast.error(detail ? `Order Failed: ${detail}` : 'Failed to create order.');
        }
    });

    const addItem = () => setItems(prev => [...prev, { product_id: '', quantity: 1, unit_price: 0 }]);
    const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
        setItems(prev => {
            const next = [...prev];
            // If selecting a product, auto-fill unit price
            if (field === 'product_id' && typeof value === 'string') {
                const prod = products?.find(p => p.id === value);
                next[i] = { ...next[i], product_id: value, unit_price: prod?.unit_price ?? 0 };
            } else {
                (next[i] as any)[field] = value;
            }
            return next;
        });
    };

    const totalAmount = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId) { toast.error('Please select a branch.'); return; }
        if (items.some(it => !it.product_id)) { toast.error('All line items must have a product selected.'); return; }

        mutation.mutate({
            order_number: orderNumber,
            order_type: orderType,
            status: 'draft',
            branch_id: branchId,
            supplier_id: null,
            notes: notes || null,
            items: items.map(it => ({
                product_id: it.product_id,
                quantity: it.quantity,
                unit_price: String(it.unit_price),
            })),
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div
                className="w-full max-w-2xl rounded-xl border border-white/10 bg-card shadow-[0_0_40px_rgba(0,184,217,0.15)] overflow-hidden animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <PackagePlus className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Create New Order</h2>
                            <p className="text-xs text-muted-foreground font-mono">{orderNumber}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[80vh]">
                    <div className="p-6 space-y-5">
                        {/* Order Type Toggle */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Order Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['purchase', 'sale'] as const).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setOrderType(type)}
                                        className={cn(
                                            "py-2.5 rounded-lg border text-sm font-semibold capitalize transition-all",
                                            orderType === type
                                                ? type === 'purchase'
                                                    ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                                                    : "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                                                : "border-white/10 text-muted-foreground hover:bg-white/5"
                                        )}
                                    >
                                        {type === 'purchase' ? '📦 Purchase (Inbound)' : '🚀 Sale (Outbound)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Branch + Supplier */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Branch *</label>
                                <select
                                    required
                                    value={branchId}
                                    onChange={e => setBranchId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="" disabled className="bg-background">Select branch...</option>
                                    {branches?.map(b => (
                                        <option key={b.id} value={b.id} className="bg-background">{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notes</label>
                                <Input
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Optional notes..."
                                />
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Line Items</label>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Item
                                </Button>
                            </div>

                            <div className="rounded-lg border border-white/5 overflow-hidden">
                                <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-0 text-xs text-muted-foreground bg-muted/30 px-3 py-2 border-b border-white/5">
                                    <span>Product</span>
                                    <span>Qty</span>
                                    <span>Unit Price</span>
                                    <span></span>
                                </div>
                                {items.map((item, i) => (
                                    <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 p-2 border-b border-white/5 last:border-0 items-center">
                                        <select
                                            required
                                            value={item.product_id}
                                            onChange={e => updateItem(i, 'product_id', e.target.value)}
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="" disabled className="bg-background">Pick product...</option>
                                            {products?.map(p => (
                                                <option key={p.id} value={p.id} className="bg-background">{p.name}</option>
                                            ))}
                                        </select>
                                        <Input
                                            type="number" min="1" required
                                            value={item.quantity}
                                            onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                                            className="h-9"
                                        />
                                        <Input
                                            type="number" min="0" step="0.01" required
                                            value={item.unit_price}
                                            onChange={e => updateItem(i, 'unit_price', Number(e.target.value))}
                                            className="h-9"
                                        />
                                        <Button
                                            type="button" variant="ghost" size="icon"
                                            className="h-9 w-9 text-destructive/60 hover:text-destructive"
                                            onClick={() => removeItem(i)}
                                            disabled={items.length === 1}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex justify-end">
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total Amount</p>
                                <p className="text-2xl font-bold text-primary drop-shadow-[0_0_8px_rgba(0,184,217,0.4)]">
                                    ${totalAmount.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending} className="shadow-[0_0_15px_rgba(0,184,217,0.3)]">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Place Order
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
