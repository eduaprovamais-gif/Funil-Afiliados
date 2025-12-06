import { createClient } from '@supabase/supabase-js';
import type { KiwifyWebhookPayload, KiwifyOrderData, KiwifySubscriptionData } from '../types/kiwify.types';
import { KIWIFY_PRODUCT_PLANS } from '../config/kiwify.config';

// Inicializar Supabase com service role para bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Processa webhook da Kiwify
 */
export async function handleKiwifyWebhook(payload: KiwifyWebhookPayload) {
    console.log('[Kiwify Webhook] Received event:', payload.event);

    try {
        switch (payload.event) {
            case 'order.paid':
                return await handleOrderPaid(payload.data as KiwifyOrderData);

            case 'order.refunded':
                return await handleOrderRefunded(payload.data as KiwifyOrderData);

            case 'subscription.started':
                return await handleSubscriptionStarted(payload.data as KiwifySubscriptionData);

            case 'subscription.cancelled':
                return await handleSubscriptionCancelled(payload.data as KiwifySubscriptionData);

            case 'subscription.expired':
                return await handleSubscriptionExpired(payload.data as KiwifySubscriptionData);

            default:
                console.log('[Kiwify Webhook] Unhandled event:', payload.event);
                return { success: true, message: 'Event not handled' };
        }
    } catch (error) {
        console.error('[Kiwify Webhook] Error processing webhook:', error);
        throw error;
    }
}

/**
 * Processa pagamento aprovado
 */
async function handleOrderPaid(data: KiwifyOrderData) {
    console.log('[Kiwify] Processing order.paid:', data.order_id);

    // Buscar ou criar perfil do usuário
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', data.customer.email)
        .single();

    let userId: string;

    if (profileError || !profile) {
        // Criar usuário no auth e perfil
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.customer.email,
            email_confirm: true,
            user_metadata: {
                full_name: data.customer.name,
            },
        });

        if (authError) {
            throw new Error(`Failed to create user: ${authError.message}`);
        }

        userId = authData.user.id;
    } else {
        userId = profile.id;
    }

    // Determinar o plano baseado no produto
    const planType = KIWIFY_PRODUCT_PLANS[data.product_id as keyof typeof KIWIFY_PRODUCT_PLANS] || 'basic';

    // Criar ou atualizar assinatura
    if (data.subscription) {
        // É uma assinatura recorrente
        const expiresAt = data.subscription.next_charge_date
            ? new Date(data.subscription.next_charge_date)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

        const { error: subError } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: userId,
                plan_type: planType,
                status: 'active',
                kiwify_subscription_id: data.subscription.id,
                kiwify_customer_id: data.customer.id,
                expires_at: expiresAt.toISOString(),
                kiwify_data: data,
            }, {
                onConflict: 'kiwify_subscription_id',
            });

        if (subError) {
            throw new Error(`Failed to create subscription: ${subError.message}`);
        }

        console.log('[Kiwify] Subscription created/updated for user:', userId);
    } else {
        // É um pagamento único (lifetime ou período específico)
        const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 ano

        const { error: subError } = await supabaseAdmin
            .from('subscriptions')
            .insert({
                user_id: userId,
                plan_type: planType,
                status: 'active',
                kiwify_customer_id: data.customer.id,
                expires_at: expiresAt.toISOString(),
                kiwify_data: data,
            });

        if (subError) {
            throw new Error(`Failed to create subscription: ${subError.message}`);
        }

        console.log('[Kiwify] One-time payment subscription created for user:', userId);
    }

    return { success: true, message: 'Order processed successfully' };
}

/**
 * Processa reembolso
 */
async function handleOrderRefunded(data: KiwifyOrderData) {
    console.log('[Kiwify] Processing order.refunded:', data.order_id);

    // Cancelar assinatura
    if (data.subscription) {
        const { error } = await supabaseAdmin
            .from('subscriptions')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
            })
            .eq('kiwify_subscription_id', data.subscription.id);

        if (error) {
            throw new Error(`Failed to cancel subscription: ${error.message}`);
        }
    }

    return { success: true, message: 'Refund processed successfully' };
}

/**
 * Processa início de assinatura
 */
async function handleSubscriptionStarted(data: KiwifySubscriptionData) {
    console.log('[Kiwify] Processing subscription.started:', data.subscription_id);

    // Buscar usuário pelo email
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', data.customer_id) // Assumindo que customer_id é o email
        .single();

    if (!profile) {
        throw new Error('User not found');
    }

    const planType = KIWIFY_PRODUCT_PLANS[data.product_id as keyof typeof KIWIFY_PRODUCT_PLANS] || 'basic';
    const expiresAt = data.next_charge_date
        ? new Date(data.next_charge_date)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const { error } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
            user_id: profile.id,
            plan_type: planType,
            status: 'active',
            kiwify_subscription_id: data.subscription_id,
            kiwify_customer_id: data.customer_id,
            expires_at: expiresAt.toISOString(),
            kiwify_data: data,
        }, {
            onConflict: 'kiwify_subscription_id',
        });

    if (error) {
        throw new Error(`Failed to start subscription: ${error.message}`);
    }

    return { success: true, message: 'Subscription started successfully' };
}

/**
 * Processa cancelamento de assinatura
 */
async function handleSubscriptionCancelled(data: KiwifySubscriptionData) {
    console.log('[Kiwify] Processing subscription.cancelled:', data.subscription_id);

    const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
            status: 'cancelled',
            cancelled_at: data.cancelled_at || new Date().toISOString(),
        })
        .eq('kiwify_subscription_id', data.subscription_id);

    if (error) {
        throw new Error(`Failed to cancel subscription: ${error.message}`);
    }

    return { success: true, message: 'Subscription cancelled successfully' };
}

/**
 * Processa expiração de assinatura
 */
async function handleSubscriptionExpired(data: KiwifySubscriptionData) {
    console.log('[Kiwify] Processing subscription.expired:', data.subscription_id);

    const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
            status: 'expired',
            expires_at: data.expires_at || new Date().toISOString(),
        })
        .eq('kiwify_subscription_id', data.subscription_id);

    if (error) {
        throw new Error(`Failed to expire subscription: ${error.message}`);
    }

    return { success: true, message: 'Subscription expired successfully' };
}

/**
 * Valida assinatura do webhook (opcional mas recomendado)
 */
export function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implementar validação HMAC se a Kiwify fornecer
    // Por enquanto, retorna true
    return true;
}
