import { apiClient } from './client';
import type { Profile } from '@/types/schema';

export type ProfileWithBranch = Profile & {
    branches?: { name: string } | null;
};

export const fetchUsers = async (): Promise<ProfileWithBranch[]> => {
    try {
        const response = await apiClient.get<ProfileWithBranch[]>('/users/');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch users from backend:', error);
        throw error;
    }
};

export const updateUserRole = async (userId: string, role: string): Promise<ProfileWithBranch> => {
    try {
        const response = await apiClient.put<ProfileWithBranch>(`/users/${userId}/role`, { role });
        return response.data;
    } catch (error) {
        console.error('Failed to update user role:', error);
        throw error;
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        await apiClient.delete(`/users/${userId}`);
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
    }
};
