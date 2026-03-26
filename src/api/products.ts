import { apiClient } from './client';
import type { Product } from '@/types/schema';

export const fetchProducts = async (): Promise<Product[]> => {
    try {
        const response = await apiClient.get<Product[]>('/products/');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch products from backend:', error);
        throw error;
    }
};

export const createProduct = async (newProduct: Partial<Product>): Promise<Product> => {
    try {
        const response = await apiClient.post<Product>('/products/', newProduct);
        return response.data;
    } catch (error) {
        console.error('Failed to create product in backend:', error);
        throw error;
    }
};
