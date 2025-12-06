import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

import { handleKiwifyWebhook } from './services/kiwify.service';

// Mock payload for order.paid
const mockPayload = {
    event: 'order.paid',
    data: {
        order_id: 'ord_test_123',
        product_id: 'produto-basic-mensal', // Must match config
        customer: {
            id: 'cus_test_123',
            name: 'Webhook Test User',
            email: `webhook.test.${Date.now()}@example.com`,
            mobile: '+5511999999999'
        },
        subscription: {
            id: 'sub_test_123',
            plan_id: 'plan_basic',
            status: 'active',
            next_charge_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
    }
};

console.log('🚀 Simulating Kiwify Webhook...');

try {
    // @ts-ignore
    const result = await handleKiwifyWebhook(mockPayload);
    console.log('✅ Result:', result);
} catch (error) {
    console.error('❌ Error:', error);
}
