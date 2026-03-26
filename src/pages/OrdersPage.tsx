import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, FileText, CheckCircle2, Clock, XCircle, GripVertical, PackagePlus } from 'lucide-react';
import type { Order, OrderStatus } from '@/types/schema';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CreateOrderModal } from '@/components/CreateOrderModal';

import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { fetchOrders, updateOrderStatus } from '@/api/orders';
import { useProfile } from '@/hooks/useProfile';

const COLUMNS: { id: OrderStatus; title: string }[] = [
    { id: 'draft', title: 'Awaiting Confirmation' },
    { id: 'confirmed', title: 'Processing / Packing' },
    { id: 'shipped', title: 'In Transit' },
    { id: 'delivered', title: 'Completed' },
];

const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
        case 'delivered': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        case 'shipped': return <ShoppingCart className="h-4 w-4 text-primary" />;
        case 'cancelled': return <XCircle className="h-4 w-4 text-destructive" />;
        case 'draft': return <FileText className="h-4 w-4 text-muted-foreground" />;
        default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
};

// --- Sortable Item Component --- //
interface SortableOrderCardProps {
    order: Order;
}

function SortableOrderCard({ order }: SortableOrderCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: order.id, data: { order } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "relative flex flex-col gap-2 p-3 bg-card border rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors group",
                isDragging ? "opacity-50 border-primary" : "opacity-100"
            )}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{order.order_number}</span>
                {getStatusIcon(order.status)}
            </div>

            <div className="flex items-center justify-between mt-1">
                <span className="font-semibold text-lg">${Number(order.total_amount).toFixed(2)}</span>
                <span className={cn(
                    "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                    order.order_type === 'purchase' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                )}>
                    {order.order_type}
                </span>
            </div>

            <div className="absolute top-1/2 -left-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
        </div>
    );
}

// --- Droppable Column Wrapper --- //
function DroppableColumnArea({ id, children }: { id: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex flex-col gap-3 min-h-[100px] p-1 rounded-lg transition-colors duration-200',
                isOver && 'bg-primary/5 ring-1 ring-primary/30'
            )}
        >
            {children}
        </div>
    );
}


// --- Main Page Component --- //
export function OrdersPage() {
    const queryClient = useQueryClient();
    const { data: profile, isLoading: isProfileLoading } = useProfile();
    // Staff can also manage orders
    const canManageOrders = !isProfileLoading && (profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'staff');

    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    // Internal state to manage optimistic sorting
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const [localOrders, setLocalOrders] = React.useState<Order[]>([]);

    const { data: orders, isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: fetchOrders,
    });

    React.useEffect(() => {
        if (orders) setLocalOrders(orders);
    }, [orders]);

    const mutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string, status: OrderStatus }) => updateOrderStatus(orderId, status),
        onSuccess: (data) => {
            toast.success(`Order moved to ${data.status}`);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (err: any) => {
            toast.error(`Failed to update order: ${err.response?.data?.detail || err.message}`);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px drag distance before firing to prevent accidental clicks
            },
            disabled: !canManageOrders,
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
            disabled: !canManageOrders,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId === overId) return;

        const isActiveAColumn = COLUMNS.some(col => col.id === activeId);
        const isOverAColumn = COLUMNS.some(col => col.id === overId);

        if (isActiveAColumn) return;

        setLocalOrders((prev) => {
            const activeIndex = prev.findIndex((t) => t.id === activeId);
            const overIndex = prev.findIndex((t) => t.id === overId);

            if (activeIndex === -1) return prev;

            const newOrders = [...prev];
            const activeOrder = { ...newOrders[activeIndex] };
            newOrders[activeIndex] = activeOrder;

            // Dropping over another item
            if (overIndex >= 0 && !isOverAColumn) {
                activeOrder.status = newOrders[overIndex].status;
                return arrayMove(newOrders, activeIndex, overIndex);
            }

            // Dropping over an empty column
            if (isOverAColumn) {
                activeOrder.status = overId as OrderStatus;
                return arrayMove(newOrders, activeIndex, newOrders.length - 1);
            }

            return prev;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        const activeOrder = localOrders.find(o => o.id === activeId);
        if (!activeOrder) return;

        let newStatus = activeOrder.status;

        const isOverAColumn = COLUMNS.some(col => col.id === overId);
        if (isOverAColumn) {
            newStatus = overId as OrderStatus;
        } else {
            const overOrder = localOrders.find(o => o.id === overId);
            if (overOrder) newStatus = overOrder.status;
        }

        // Fire mutation if status actually changed
        const originalOrder = orders?.find(o => o.id === activeId);
        if (originalOrder && originalOrder.status !== newStatus) {
            mutation.mutate({ orderId: activeOrder.id, status: newStatus });
        }
    };

    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading tactical command stream...</div>;

    const activeOrderData = activeId ? localOrders.find(o => o.id === activeId) : null;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <CreateOrderModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            <div className="mb-6 flex-shrink-0 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_8px_rgba(0,184,217,0.5)]">Mission Control: Orders</h1>
                    <p className="text-muted-foreground mt-1">
                        Drag and drop shipments to update their fulfillment status in real-time.
                    </p>
                </div>
                {canManageOrders && (
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="shadow-[0_0_15px_rgba(0,184,217,0.3)] hover:shadow-[0_0_25px_rgba(0,184,217,0.5)] transition-shadow"
                    >
                        <PackagePlus className="mr-2 h-4 w-4" /> New Order
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-6 h-full min-w-max">
                        {COLUMNS.map((column) => {
                            const columnOrders = localOrders.filter(order => order.status === column.id);

                            return (
                                <div key={column.id} className="w-[300px] flex flex-col bg-muted/20 backdrop-blur-md border rounded-xl overflow-hidden shrink-0">
                                    <div className="p-4 border-b bg-card/50 flex items-center justify-between">
                                        <h3 className="font-semibold text-sm tracking-wide uppercase">{column.title}</h3>
                                        <span className="bg-primary/20 text-primary text-xs font-mono px-2 py-0.5 rounded-full">{columnOrders.length}</span>
                                    </div>

                                    <div className="flex-1 p-3 overflow-y-auto">
                                        <SortableContext
                                            id={column.id}
                                            items={columnOrders.map(o => o.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <DroppableColumnArea id={column.id}>
                                                {columnOrders.map(order => (
                                                    <SortableOrderCard key={order.id} order={order} />
                                                ))}
                                            </DroppableColumnArea>
                                        </SortableContext>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <DragOverlay>
                        {activeOrderData ? (
                            <div className="opacity-80 rotate-3 scale-105 transition-transform cursor-grabbing ring-2 ring-primary">
                                <SortableOrderCard order={activeOrderData} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}
