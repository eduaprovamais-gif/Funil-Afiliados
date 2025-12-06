import { Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';

interface PlanFeature {
    text: string;
    included: boolean;
}

interface Plan {
    name: string;
    price: string;
    period: string;
    description: string;
    features: PlanFeature[];
    cta: string;
    highlighted?: boolean;
    kiwifyProductId?: string;
}

const plans: Plan[] = [
    {
        name: 'Basic',
        price: 'R$ 47',
        period: '/mês',
        description: 'Perfeito para começar',
        features: [
            { text: 'Até 10 funis', included: true },
            { text: 'Analytics básico', included: true },
            { text: 'Publicação ilimitada', included: true },
            { text: 'Suporte por email', included: true },
            { text: 'Templates premium', included: false },
            { text: 'Analytics avançado', included: false },
            { text: 'White label', included: false },
        ],
        cta: 'Começar Agora',
        kiwifyProductId: 'produto-id-basic-mensal', // Substituir pelo ID real
    },
    {
        name: 'Pro',
        price: 'R$ 97',
        period: '/mês',
        description: 'Para profissionais',
        features: [
            { text: 'Até 25 funis', included: true },
            { text: 'Analytics avançado', included: true },
            { text: 'Templates premium', included: true },
            { text: 'Publicação ilimitada', included: true },
            { text: 'Suporte prioritário', included: true },
            { text: 'Integrações avançadas', included: true },
            { text: 'White label', included: false },
        ],
        cta: 'Upgrade para Pro',
        highlighted: true,
        kiwifyProductId: 'produto-id-pro-mensal', // Substituir pelo ID real
    },
    {
        name: 'Black',
        price: 'R$ 197',
        period: '/mês',
        description: 'Solução completa',
        features: [
            { text: 'Funis ilimitados', included: true },
            { text: 'Analytics avançado', included: true },
            { text: 'Templates premium', included: true },
            { text: 'White label completo', included: true },
            { text: 'Suporte VIP', included: true },
            { text: 'API de integração', included: true },
            { text: 'Gerente de conta dedicado', included: true },
        ],
        cta: 'Ir para Black',
        kiwifyProductId: 'produto-id-black-mensal', // Substituir pelo ID real
    },
];

export default function Pricing() {
    const { user } = useAuth();
    const { planType, isTrialActive, trialDaysRemaining } = useSubscription();

    const handleSelectPlan = (plan: Plan) => {
        // TODO: Integrar com Kiwify para redirecionar para checkout
        // Por enquanto, redireciona para uma URL de exemplo
        const checkoutUrl = `https://pay.kiwify.com.br/${plan.kiwifyProductId}`;

        if (user?.email) {
            // Pré-preencher email do usuário
            window.location.href = `${checkoutUrl}?email=${encodeURIComponent(user.email)}`;
        } else {
            window.location.href = checkoutUrl;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Escolha o Plano Ideal para Você
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Crie funis de vendas incríveis e aumente suas conversões
                    </p>

                    {isTrialActive && (
                        <div className="mt-6 inline-block bg-green-100 text-green-800 px-6 py-3 rounded-full font-medium">
                            🎉 Você tem {trialDaysRemaining} dias restantes de trial gratuito!
                        </div>
                    )}
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => {
                        const isCurrentPlan = planType === plan.name.toLowerCase();

                        return (
                            <div
                                key={plan.name}
                                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${plan.highlighted ? 'ring-4 ring-purple-500 md:scale-105' : ''
                                    }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                                        POPULAR
                                    </div>
                                )}

                                {isCurrentPlan && (
                                    <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 text-sm font-bold rounded-br-lg">
                                        PLANO ATUAL
                                    </div>
                                )}

                                <div className="p-8">
                                    {/* Plan Header */}
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {plan.name}
                                    </h3>
                                    <p className="text-gray-600 mb-6">{plan.description}</p>

                                    {/* Price */}
                                    <div className="mb-6">
                                        <span className="text-5xl font-bold text-gray-900">
                                            {plan.price}
                                        </span>
                                        <span className="text-gray-600 text-lg">{plan.period}</span>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={isCurrentPlan}
                                        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${plan.highlighted
                                                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
                                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                            } ${isCurrentPlan
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:scale-105'
                                            }`}
                                    >
                                        {isCurrentPlan ? 'Plano Atual' : plan.cta}
                                    </button>

                                    {/* Features */}
                                    <ul className="mt-8 space-y-4">
                                        {plan.features.map((feature, index) => (
                                            <li
                                                key={index}
                                                className={`flex items-start gap-3 ${feature.included ? 'text-gray-700' : 'text-gray-400'
                                                    }`}
                                            >
                                                <Check
                                                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${feature.included ? 'text-green-500' : 'text-gray-300'
                                                        }`}
                                                />
                                                <span className={feature.included ? '' : 'line-through'}>
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <div className="mt-20 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Perguntas Frequentes
                    </h2>

                    <div className="space-y-6">
                        <details className="bg-white rounded-lg shadow-md p-6 cursor-pointer">
                            <summary className="font-bold text-lg">
                                Posso cancelar a qualquer momento?
                            </summary>
                            <p className="mt-3 text-gray-600">
                                Sim! Você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais.
                            </p>
                        </details>

                        <details className="bg-white rounded-lg shadow-md p-6 cursor-pointer">
                            <summary className="font-bold text-lg">
                                Como funciona o trial gratuito?
                            </summary>
                            <p className="mt-3 text-gray-600">
                                Ao se cadastrar, você recebe 7 dias de trial gratuito com acesso a todas as funcionalidades do plano Basic.
                            </p>
                        </details>

                        <details className="bg-white rounded-lg shadow-md p-6 cursor-pointer">
                            <summary className="font-bold text-lg">
                                Posso fazer upgrade do meu plano?
                            </summary>
                            <p className="mt-3 text-gray-600">
                                Sim! Você pode fazer upgrade para um plano superior a qualquer momento e pagar apenas a diferença proporcional.
                            </p>
                        </details>

                        <details className="bg-white rounded-lg shadow-md p-6 cursor-pointer">
                            <summary className="font-bold text-lg">
                                Os funis criados ficam salvos se eu cancelar?
                            </summary>
                            <p className="mt-3 text-gray-600">
                                Sim, seus funis permanecem salvos. Porém, você não poderá criar novos ou publicar até reativar a assinatura.
                            </p>
                        </details>
                    </div>
                </div>

                {/* Guarantee */}
                <div className="mt-16 text-center bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8 max-w-3xl mx-auto">
                    <h3 className="text-2xl font-bold mb-4">Garantia de 7 Dias</h3>
                    <p className="text-gray-700 text-lg">
                        Se você não estiver satisfeito com o XQuiz, devolvemos 100% do seu dinheiro nos primeiros 7 dias. Sem perguntas, sem complicações.
                    </p>
                </div>
            </div>
        </div>
    );
}
