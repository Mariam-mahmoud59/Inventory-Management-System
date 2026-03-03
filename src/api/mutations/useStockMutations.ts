import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { StockLevel } from '../../types/schema';

export interface DefaultStockResponse {
    success: boolean;
    quantity_before: number;
    quantity_after: number;
    low_stock_alert: boolean;
}

export interface AdjustStockPayload {
    product_id: string;
    branch_id: string;
    quantity_change: number;
    txn_type: string;
    performed_by: string; // Auth context would provide this normally
    notes?: string;
}

export function useAdjustStockMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: AdjustStockPayload) => {
            // MOCK: Simulate successful network delay instead of failing API call
            await new Promise((resolve) => setTimeout(resolve, 800));
            return {
                success: true,
                quantity_before: 0,
                quantity_after: payload.quantity_change,
                low_stock_alert: false,
            } as DefaultStockResponse;
        },
        // Optimistic Update Implementation
        onMutate: async (newAdjustment) => {
            // Cancel any outgoing refetches for 'stock' so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['stock'] });

            // Snapshot the previous value
            const previousStock = queryClient.getQueryData(['stock']);

            // Optimistically update to the new value
            queryClient.setQueryData(['stock'], (old: StockLevel[] | undefined) => {
                if (!old) return old;
                // Map over cached data and instantly adjust the quantity of the specific product in the branch
                return old.map((item: StockLevel) => {
                    if (
                        item.product_id === newAdjustment.product_id &&
                        item.branch_id === newAdjustment.branch_id
                    ) {
                        return {
                            ...item,
                            quantity: item.quantity + newAdjustment.quantity_change,
                        };
                    }
                    return item;
                });
            });

            toast.info('Adjusting stock...', { id: 'stock-adjust' });

            // Return a context with the previous stock data to roll back if necessary
            return { previousStock };
        },
        onError: (err, _newAdjustment, context) => {
            // Rollback to the previous state on error
            if (context?.previousStock) {
                queryClient.setQueryData(['stock'], context.previousStock);
            }
            toast.error('Stock adjustment failed. Reverting changes.', { id: 'stock-adjust' });
            console.error(err);
        },
        onSuccess: (data) => {
            toast.success('Stock adjusted successfully!', { id: 'stock-adjust' });
            if (data.low_stock_alert) {
                toast.warning('Warning: This adjustment resulted in low stock.');
            }
        },
        onSettled: () => {
            // Always refetch after error or success to ensure data consistency
            queryClient.invalidateQueries({ queryKey: ['stock'] });
        },
    });
}
