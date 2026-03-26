import { apiClient } from './client';

export interface DashboardSummary {
    total_inventory_value: number;
    low_stock_alerts: any[];
    order_summary: {
        pending: number;
        delivered: number;
    };
    recent_transactions: any[];
}

export const fetchDashboardStats = async (): Promise<DashboardSummary> => {
    try {
        const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        throw error;
    }
};

export interface AnalyticsData {
    valuation_trend: { month: string; value: number; cost: number }[];
    movement_by_category: { name: string; in: number; out: number }[];
}

export const fetchAnalytics = async (): Promise<AnalyticsData> => {
    try {
        const response = await apiClient.get<AnalyticsData>('/dashboard/analytics');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch analytics:', error);
        throw error;
    }
};
