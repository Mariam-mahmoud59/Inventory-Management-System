import { apiClient } from './client';
import type { Branch } from '@/types/schema';

export const fetchBranches = async (): Promise<Branch[]> => {
    try {
        const response = await apiClient.get<Branch[]>('/branches/');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch branches from backend:', error);
        throw error;
    }
};

export const createBranch = async (data: Partial<Branch>): Promise<Branch> => {
    try {
        const response = await apiClient.post<Branch>('/branches/', data);
        return response.data;
    } catch (error) {
        console.error('Failed to create branch:', error);
        throw error;
    }
};

export const updateBranch = async (id: string, data: Partial<Branch>): Promise<Branch> => {
    try {
        const response = await apiClient.put<Branch>(`/branches/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Failed to update branch:', error);
        throw error;
    }
};
