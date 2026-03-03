export type UserRole = 'admin' | 'manager' | 'staff';
export type OrderType = 'purchase' | 'sale';
export type OrderStatus = 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type TxnType =
    | 'purchase_in'
    | 'sale_out'
    | 'adjustment_in'
    | 'adjustment_out'
    | 'transfer_in'
    | 'transfer_out';

export interface Category {
    id: string; // UUID
    name: string;
    description: string | null;
    created_at: string; // ISO Datetime
}

export interface Supplier {
    id: string; // UUID
    name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    created_at: string;
    updated_at: string;
}

export interface Branch {
    id: string; // UUID
    name: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
}

export interface Product {
    id: string; // UUID
    sku: string;
    barcode: string | null;
    name: string;
    description: string | null;
    category_id: string | null;
    supplier_id: string | null;
    unit_price: number;
    cost_price: number;
    min_stock_level: number;
    image_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;

    // Optional joins
    category?: Category | null;
    supplier?: Supplier | null;
}

export interface StockLevel {
    id: string; // UUID
    product_id: string;
    branch_id: string;
    quantity: number;
    updated_at: string;

    // Optional joins
    product?: Product;
    branch?: Branch;
}

export interface StockTransaction {
    id: string; // UUID
    stock_level_id: string;
    txn_type: TxnType;
    quantity_change: number;
    quantity_before: number;
    quantity_after: number;
    reference_id: string | null;
    notes: string | null;
    performed_by: string; // UUID of user
    created_at: string;

    // Optional joins
    stock_level?: StockLevel;
    performer?: Profile;
}

export interface Order {
    id: string; // UUID
    order_number: string;
    order_type: OrderType;
    status: OrderStatus;
    branch_id: string;
    supplier_id: string | null; // Only for purchase orders
    total_amount: number;
    notes: string | null;
    created_by: string; // UUID of user
    created_at: string;
    updated_at: string;

    // Optional joins
    branch?: Branch;
    supplier?: Supplier | null;
    items?: OrderItem[];
    creator?: Profile;
}

export interface OrderItem {
    id: string; // UUID
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;

    // Optional joins
    product?: Product;
}

export interface Profile {
    id: string; // UUID matching auth.users
    full_name: string | null;
    avatar_url: string | null;
    branch_id: string | null;
    role: UserRole;
    is_active: boolean;
    created_at: string;

    // Optional joins
    branch?: Branch | null;
}

export interface Notification {
    id: string; // UUID
    user_id: string | null;
    title: string;
    message: string;
    is_read: boolean;
    metadata: Record<string, unknown> | null;
    created_at: string;
}
