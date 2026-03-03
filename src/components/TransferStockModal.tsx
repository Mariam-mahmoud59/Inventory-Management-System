import * as React from 'react';
import { X, Loader2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TransferStockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TransferStockModal({ isOpen, onClose }: TransferStockModalProps) {
    const queryClient = useQueryClient();

    // Mock mutation for transferring stock
    const transferMutation = useMutation({
        mutationFn: async (data: { source: string, dest: string, product: string, quantity: number }) => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return data;
        },
        onSuccess: () => {
            toast.success('Stock transferred successfully!');
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            onClose();
        },
        onError: () => {
            toast.error('Failed to transfer stock.');
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        transferMutation.mutate({
            source: formData.get('sourceBranch') as string,
            dest: formData.get('destBranch') as string,
            product: formData.get('product') as string,
            quantity: Number(formData.get('quantity')),
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-semibold">Transfer Stock</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="product" className="text-sm font-medium">Product SKU</label>
                        <Input id="product" name="product" required placeholder="e.g. SKU-1001" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="sourceBranch" className="text-sm font-medium">Source Branch</label>
                            <select
                                id="sourceBranch"
                                name="sourceBranch"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="" disabled selected>Select...</option>
                                <option value="branch-1">Main Warehouse</option>
                                <option value="branch-2">Downtown Store</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="destBranch" className="text-sm font-medium">Destination</label>
                            <select
                                id="destBranch"
                                name="destBranch"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="" disabled selected>Select...</option>
                                <option value="branch-2">Downtown Store</option>
                                <option value="branch-1">Main Warehouse</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="quantity" className="text-sm font-medium">Quantity to Transfer</label>
                        <Input id="quantity" name="quantity" type="number" min="1" required placeholder="0" />
                    </div>

                    <div className="pt-4 flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={transferMutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={transferMutation.isPending}>
                            {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Execute Transfer
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
