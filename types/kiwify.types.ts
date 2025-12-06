// Types for Kiwify Webhook Events

export interface KiwifyWebhookPayload {
    event: string;
    data: KiwifyOrderData | KiwifySubscriptionData;
    timestamp: string;
    signature?: string;
}

export interface KiwifyOrderData {
    order_id: string;
    order_ref: string;
    product_id: string;
    product_name: string;
    customer: {
        id: string;
        email: string;
        name: string;
        phone?: string;
    };
    payment: {
        status: 'paid' | 'pending' | 'refunded' | 'chargeback';
        method: 'credit_card' | 'pix' | 'boleto';
        amount: number;
        currency: string;
        paid_at?: string;
    };
    subscription?: {
        id: string;
        status: string;
        plan: string;
        next_charge_date?: string;
    };
}

export interface KiwifySubscriptionData {
    subscription_id: string;
    customer_id: string;
    product_id: string;
    product_name: string;
    plan: 'monthly' | 'yearly';
    status: 'active' | 'cancelled' | 'expired' | 'past_due';
    started_at: string;
    expires_at?: string;
    cancelled_at?: string;
    next_charge_date?: string;
    amount: number;
    currency: string;
}

export interface KiwifyWebhookResponse {
    success: boolean;
    message?: string;
    error?: string;
}
