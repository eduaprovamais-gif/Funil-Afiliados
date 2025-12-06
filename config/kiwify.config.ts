// Kiwify API Configuration
export const KIWIFY_CONFIG = {
    clientId: 'e558533b-cef9-4075-b10d-3f94a685b073',
    accountId: 'jq987acP3BtaLRw',
    // client_secret deve estar no .env.local por segurança
};

export const KIWIFY_ENDPOINTS = {
    baseUrl: 'https://api.kiwify.com.br',
    webhooks: '/webhooks',
    subscriptions: '/subscriptions',
    orders: '/orders',
};

// Tipos de eventos do webhook
export type KiwifyWebhookEvent =
    | 'order.paid'
    | 'order.refunded'
    | 'order.chargeback'
    | 'subscription.started'
    | 'subscription.updated'
    | 'subscription.cancelled'
    | 'subscription.expired'
    | 'subscription.payment_failed';

// Mapeamento de produtos Kiwify para planos XQuiz
export const KIWIFY_PRODUCT_PLANS = {
    // Substitua pelos IDs reais dos seus produtos na Kiwify
    'produto-basic-mensal': 'basic',
    'produto-basic-anual': 'basic',
    'produto-pro-mensal': 'pro',
    'produto-pro-anual': 'pro',
    'produto-black-mensal': 'black',
    'produto-black-anual': 'black',
} as const;
