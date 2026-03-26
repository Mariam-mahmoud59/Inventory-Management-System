import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Calendar, TrendingUp, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchAnalytics } from '@/api/dashboard';

export function ReportsPage() {
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: fetchDashboardStats,
    });

    const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
        queryKey: ['dashboard-analytics'],
        queryFn: fetchAnalytics,
    });

    const formattedValue = !statsData?.total_inventory_value
        ? '$0.00'
        : new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(statsData.total_inventory_value);

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_8px_rgba(0,184,217,0.5)]">Reports & Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualize inventory valuation, turnover, and historical trends.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4 opacity-50" />
                        <span>Last 7 Months</span>
                    </Button>
                    <Button>Export CSV</Button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-xl text-card-foreground shadow-[0_4px_20px_rgba(0,0,0,0.5)] p-6 flex items-center space-x-4 transition-all hover:bg-black/60 hover:shadow-[0_8px_30px_rgba(0,184,217,0.2)] hover:border-primary/30 group">
                    <div className="p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all">
                        <DollarSign className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-primary/80 transition-colors">Total Inventory Value</p>
                        <h3 className="text-2xl font-bold tracking-tight group-hover:text-white transition-colors">{statsLoading ? '...' : formattedValue}</h3>
                    </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-xl text-card-foreground shadow-[0_4px_20px_rgba(0,0,0,0.5)] p-6 flex items-center space-x-4 transition-all hover:bg-black/60 hover:shadow-[0_8px_30px_rgba(0,184,217,0.2)] hover:border-primary/30 group">
                    <div className="p-3 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all">
                        <TrendingUp className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-primary/80 transition-colors">Est. Profit Margin</p>
                        <h3 className="text-2xl font-bold tracking-tight group-hover:text-white transition-colors">41.2%</h3>
                    </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-xl text-card-foreground shadow-[0_4px_20px_rgba(0,0,0,0.5)] p-6 flex items-center space-x-4 transition-all hover:bg-black/60 hover:shadow-[0_8px_30px_rgba(0,184,217,0.2)] hover:border-primary/30 group">
                    <div className="p-3 bg-amber-500/10 rounded-full group-hover:bg-amber-500/20 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all">
                        <Package className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-primary/80 transition-colors">Low Stock SKUs</p>
                        <h3 className="text-2xl font-bold tracking-tight group-hover:text-white transition-colors">{statsLoading ? '...' : statsData?.low_stock_alerts?.length || 0}</h3>
                    </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-xl text-card-foreground shadow-[0_4px_20px_rgba(0,0,0,0.5)] p-6 flex items-center space-x-4 transition-all hover:bg-black/60 hover:shadow-[0_8px_30px_rgba(0,184,217,0.2)] hover:border-primary/30 group">
                    <div className="p-3 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all">
                        <Calendar className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-primary/80 transition-colors">Stock Turnover Rate</p>
                        <h3 className="text-2xl font-bold tracking-tight group-hover:text-white transition-colors">4.8x</h3>
                    </div>
                </div>
            </div>

            {/* Main Charts Area */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Area Chart: Valuation Trend */}
                <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-xl text-card-foreground shadow-[0_4px_20px_rgba(0,0,0,0.5)] p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center justify-between">
                        Inventory Valuation Trend
                        {analyticsLoading && <span className="text-xs text-primary animate-pulse">Syncing...</span>}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analyticsData?.valuation_trend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Area type="monotone" name="Retail Value" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                                <Area type="monotone" name="Cost Basis" dataKey="cost" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart: Stock Movement by Category */}
                <div className="rounded-xl border border-white/5 bg-black/40 backdrop-blur-xl text-card-foreground shadow-[0_4px_20px_rgba(0,0,0,0.5)] p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center justify-between">
                        Stock Movement by Category (MTD)
                        {analyticsLoading && <span className="text-xs text-primary animate-pulse">Syncing...</span>}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData?.movement_by_category || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--accent))' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Bar name="Units Received (In)" dataKey="in" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar name="Units Sold/Transferred (Out)" dataKey="out" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
