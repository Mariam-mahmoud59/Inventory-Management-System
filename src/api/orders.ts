import { apiClient } from './client';
import type { Order, OrderStatus } from '@/types/schema';

export const fetchOrders = async (): Promise<Order[]> => {
    try {
        const response = await apiClient.get<Order[]>('/orders/');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        throw error;
    }
};

export const dictCreateOrder = async (payload: any): Promise<Order> => {
    try {
        const response = await apiClient.post<Order>('/orders/', payload);
        return response.data;
    } catch (error) {
        console.error('Failed to create order:', error);
        throw error;
    }
};

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<Order> => {
    try {
        const response = await apiClient.put<Order>(`/orders/${id}/status`, { status });
        return response.data;
    } catch (error) {
        console.error('Failed to update order status:', error);
        throw error;
    }
};
