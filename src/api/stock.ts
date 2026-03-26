import { apiClient } from './client';
import type { StockLevel } from '@/types/schema';
import type { AdjustStockPayload, DefaultStockResponse } from './mutations/useStockMutations';

export const fetchStockLevels = async (branchId?: string, productId?: string): Promise<StockLevel[]> => {
    try {
        const params = new URLSearchParams();
        if (branchId) params.append('branch_id', branchId);
        if (productId) params.append('product_id', productId);

        const response = await apiClient.get<StockLevel[]>(`/stock/?${params}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch stock levels:', error);
        throw error;
    }
};

export const adjustStockLevel = async (payload: AdjustStockPayload): Promise<DefaultStockResponse> => {
    try {
        const response = await apiClient.post<DefaultStockResponse>('/stock/adjust', payload);
        return response.data;
    } catch (error) {
        console.error('Failed to adjust stock:', error);
        throw error;
    }
};

export interface TransferStockPayload {
    from_branch_id: string;
    to_branch_id: string;
    product_id: string;
    quantity: number;
    notes?: string;
}

export const transferStock = async (payload: TransferStockPayload): Promise<DefaultStockResponse> => {
    try {
        const response = await apiClient.post<DefaultStockResponse>('/stock/transfer', payload);
        return response.data;
    } catch (error) {
        console.error('Failed to transfer stock:', error);
        throw error;
    }
};
