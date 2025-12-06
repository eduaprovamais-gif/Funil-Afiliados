/**
 * Kiwify Webhook Handler
 * 
 * Este arquivo deve ser deployado como uma serverless function.
 * Para Vercel: coloque em /api/webhooks/kiwify.ts
 * Para Netlify: coloque em /netlify/functions/kiwify-webhook.ts
 */

import type { KiwifyWebhookPayload } from '../../types/kiwify.types';
import { handleKiwifyWebhook, validateWebhookSignature } from '../../services/kiwify.service';

export default async function handler(req: Request) {
    // Apenas aceitar POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const payload: KiwifyWebhookPayload = await req.json();

        // Validar assinatura do webhook (se fornecida)
        const signature = req.headers.get('x-kiwify-signature');
        const secret = process.env.KIWIFY_WEBHOOK_SECRET || '';

        if (signature && secret) {
            const isValid = validateWebhookSignature(
                JSON.stringify(payload),
                signature,
                secret
            );

            if (!isValid) {
                console.error('[Webhook] Invalid signature');
                return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        // Processar webhook
        const result = await handleKiwifyWebhook(payload);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[Webhook] Error:', error);

        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Para ambientes que usam export config
export const config = {
    runtime: 'edge', // ou 'nodejs'
};
