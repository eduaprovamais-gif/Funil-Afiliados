import { Quiz } from '../types';

export const premiumTemplates: Quiz[] = [
    {
        id: 'premium-odonto',
        title: 'Odontologia - Captação de Pacientes',
        description: 'Funil focado em agendamento de avaliação para tratamentos estéticos e implantes.',
        themeColor: 'cyan',
        avatar: '🦷',
        questions: [
            {
                id: 'q1',
                title: 'O que mais te incomoda no seu sorriso hoje?',
                description: 'Vamos entender sua necessidade principal.',
                characters: [
                    {
                        id: 'char1',
                        name: 'Dra. Ana',
                        avatar: '/characters/library_3.png',
                        speech: 'Olá! Sou a Dra. Ana. Para começarmos, me conte: o que você gostaria de mudar no seu sorriso?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Dentes amarelados', nextQuestionId: 'q2' },
                    { id: 'o2', text: 'Dentes tortos ou desalinhados', nextQuestionId: 'q2' },
                    { id: 'o3', text: 'Falta de dentes / Implantes', nextQuestionId: 'q2' },
                    { id: 'o4', text: 'Apenas check-up de rotina', nextQuestionId: 'q3' }
                ],
                position: { x: 100, y: 100 }
            },
            {
                id: 'q2',
                title: 'Há quanto tempo isso te incomoda?',
                description: 'Entender a urgência do paciente.',
                characters: [
                    {
                        id: 'char2',
                        name: 'Dra. Ana',
                        avatar: '/characters/library_3.png',
                        speech: 'Entendi. E há quanto tempo você pensa em resolver isso?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Menos de 6 meses', nextQuestionId: 'q3' },
                    { id: 'o2', text: 'Mais de 1 ano', nextQuestionId: 'q3' },
                    { id: 'o3', text: 'Sempre me incomodou', nextQuestionId: 'q3' }
                ],
                position: { x: 500, y: 100 }
            },
            {
                id: 'q3',
                title: 'Agende sua Avaliação VIP',
                description: 'Fechamento com escassez.',
                characters: [
                    {
                        id: 'char3',
                        name: 'Dra. Ana',
                        avatar: '/characters/library_3.png',
                        speech: 'Tenho uma ótima notícia! Liberamos 3 horários para avaliação gratuita esta semana. Vamos agendar?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Sim, quero agendar agora!', nextQuestionId: 'RESULT' },
                    { id: 'o2', text: 'Gostaria de saber valores antes', nextQuestionId: 'RESULT' }
                ],
                position: { x: 900, y: 100 }
            }
        ]
    },
    {
        id: 'premium-advocacia',
        title: 'Advocacia - Consultas Jurídicas',
        description: 'Funil para triagem de casos e agendamento de consultas jurídicas.',
        themeColor: 'slate',
        avatar: '⚖️',
        questions: [
            {
                id: 'q1',
                title: 'Qual a natureza do seu problema?',
                description: 'Triagem inicial da área do direito.',
                characters: [
                    {
                        id: 'char1',
                        name: 'Dr. Ricardo',
                        avatar: '/characters/library_5.png',
                        speech: 'Olá. Para direcionar seu atendimento ao especialista correto, qual área melhor descreve seu caso?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Trabalhista (Emprego/Demissão)', nextQuestionId: 'q2' },
                    { id: 'o2', text: 'Família (Divórcio/Pensão)', nextQuestionId: 'q2' },
                    { id: 'o3', text: 'Previdenciário (INSS)', nextQuestionId: 'q2' },
                    { id: 'o4', text: 'Outros assuntos', nextQuestionId: 'q2' }
                ],
                position: { x: 100, y: 100 }
            },
            {
                id: 'q2',
                title: 'Você já possui algum processo em andamento?',
                description: 'Verificação de conflito ou andamento.',
                characters: [
                    {
                        id: 'char2',
                        name: 'Dr. Ricardo',
                        avatar: '/characters/library_5.png',
                        speech: 'Certo. E você já tem algum advogado cuidando disso ou algum processo aberto?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Sim, já tenho processo', nextQuestionId: 'q3' },
                    { id: 'o2', text: 'Não, é a primeira vez', nextQuestionId: 'q3' }
                ],
                position: { x: 500, y: 100 }
            },
            {
                id: 'q3',
                title: 'Fale com um Especialista',
                description: 'Direcionamento para WhatsApp.',
                characters: [
                    {
                        id: 'char3',
                        name: 'Dr. Ricardo',
                        avatar: '/characters/library_5.png',
                        speech: 'Perfeito. Nossos especialistas estão online agora para analisar seu caso. Clique abaixo para falar no WhatsApp.'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Falar com Advogado Agora', nextQuestionId: 'RESULT' }
                ],
                position: { x: 900, y: 100 }
            }
        ]
    },
    {
        id: 'premium-barbearia',
        title: 'Barbearia - Agendamento Rápido',
        description: 'Funil visual para escolha de estilo e reserva de horário.',
        themeColor: 'orange',
        avatar: '💈',
        questions: [
            {
                id: 'q1',
                title: 'E aí, qual vai ser o estilo hoje?',
                description: 'Escolha do serviço principal.',
                characters: [
                    {
                        id: 'char1',
                        name: 'Barber Jack',
                        avatar: '/characters/library_4.png',
                        speech: 'Fala, parceiro! O que a gente vai fazer hoje pra dar aquele tapa no visual?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Corte de Cabelo', nextQuestionId: 'q2' },
                    { id: 'o2', text: 'Barba Completa', nextQuestionId: 'q2' },
                    { id: 'o3', text: 'Combo (Cabelo + Barba)', nextQuestionId: 'q2' }
                ],
                position: { x: 100, y: 100 }
            },
            {
                id: 'q2',
                title: 'Qual sua preferência de horário?',
                description: 'Pré-seleção de agenda.',
                characters: [
                    {
                        id: 'char2',
                        name: 'Barber Jack',
                        avatar: '/characters/library_4.png',
                        speech: 'Boa escolha! E qual horário fica melhor pra você encostar aqui?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Manhã (09h - 12h)', nextQuestionId: 'q3' },
                    { id: 'o2', text: 'Tarde (13h - 18h)', nextQuestionId: 'q3' },
                    { id: 'o3', text: 'Noite (18h - 21h)', nextQuestionId: 'q3' }
                ],
                position: { x: 500, y: 100 }
            },
            {
                id: 'q3',
                title: 'Garanta seu horário',
                description: 'CTA final.',
                characters: [
                    {
                        id: 'char3',
                        name: 'Barber Jack',
                        avatar: '/characters/library_4.png',
                        speech: 'Fechou! Clica aí embaixo pra confirmar o horário direto no meu Zap. As vagas voam!'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Confirmar Horário no WhatsApp', nextQuestionId: 'RESULT' }
                ],
                position: { x: 900, y: 100 }
            }
        ]
    },
    {
        id: 'premium-carros',
        title: 'Venda de Carros - Leads Qualificados',
        description: 'Funil para identificar interesse e qualificação financeira.',
        themeColor: 'red',
        avatar: '🚗',
        questions: [
            {
                id: 'q1',
                title: 'Qual tipo de carro você procura?',
                description: 'Segmentação de interesse.',
                characters: [
                    {
                        id: 'char1',
                        name: 'Consultor Roberto',
                        avatar: '/characters/library_5.png',
                        speech: 'Olá! Sou o Roberto. Para eu te mostrar as melhores ofertas, que tipo de carro você busca hoje?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'SUV / Família', nextQuestionId: 'q2' },
                    { id: 'o2', text: 'Sedan / Conforto', nextQuestionId: 'q2' },
                    { id: 'o3', text: 'Hatch / Econômico', nextQuestionId: 'q2' },
                    { id: 'o4', text: 'Picape / Utilitário', nextQuestionId: 'q2' }
                ],
                position: { x: 100, y: 100 }
            },
            {
                id: 'q2',
                title: 'Qual sua pretensão de investimento?',
                description: 'Qualificação financeira.',
                characters: [
                    {
                        id: 'char2',
                        name: 'Consultor Roberto',
                        avatar: '/characters/library_5.png',
                        speech: 'Ótimo. E qual faixa de valor você pretende investir no seu carro novo?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Até R$ 50.000', nextQuestionId: 'q3' },
                    { id: 'o2', text: 'R$ 50.000 a R$ 100.000', nextQuestionId: 'q3' },
                    { id: 'o3', text: 'Acima de R$ 100.000', nextQuestionId: 'q3' }
                ],
                position: { x: 500, y: 100 }
            },
            {
                id: 'q3',
                title: 'Agende seu Test-Drive',
                description: 'Conversão final.',
                characters: [
                    {
                        id: 'char3',
                        name: 'Consultor Roberto',
                        avatar: '/characters/library_5.png',
                        speech: 'Tenho 3 opções perfeitas nessa faixa! Vamos agendar um test-drive para você conhecer?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Ver Carros e Agendar', nextQuestionId: 'RESULT' }
                ],
                position: { x: 900, y: 100 }
            }
        ]
    },
    {
        id: 'premium-combo',
        title: 'Hamburgueria & Beleza (Combo)',
        description: 'Template versátil com dois caminhos distintos: Delivery e Serviços de Beleza.',
        themeColor: 'pink',
        avatar: '🍔',
        questions: [
            {
                id: 'q1',
                title: 'Qual é o seu negócio?',
                description: 'Seleção de nicho para o template.',
                characters: [
                    {
                        id: 'char1',
                        name: 'Assistente Virtual',
                        avatar: '🤖',
                        speech: 'Este é um template duplo! Escolha qual fluxo você deseja visualizar:'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Hamburgueria / Delivery', nextQuestionId: 'burguer-1' },
                    { id: 'o2', text: 'Salão de Beleza / Estética', nextQuestionId: 'beleza-1' }
                ],
                position: { x: 100, y: 250 }
            },
            // Fluxo Hamburgueria
            {
                id: 'burguer-1',
                title: 'Qual o tamanho da sua fome?',
                description: 'Fluxo de Hamburgueria - Passo 1',
                characters: [
                    {
                        id: 'char-b1',
                        name: 'Chef Burger',
                        avatar: '👨‍🍳',
                        speech: 'Bem-vindo à Burger King! Qual o tamanho da sua fome hoje?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Fome normal (1 Burger)', nextQuestionId: 'burguer-2' },
                    { id: 'o2', text: 'Muita fome (Combo Duplo)', nextQuestionId: 'burguer-2' },
                    { id: 'o3', text: 'Fome de Leão (Família)', nextQuestionId: 'burguer-2' }
                ],
                position: { x: 500, y: 100 }
            },
            {
                id: 'burguer-2',
                title: 'Cupom de Primeira Compra',
                description: 'Fluxo de Hamburgueria - Passo 2',
                characters: [
                    {
                        id: 'char-b2',
                        name: 'Chef Burger',
                        avatar: '👨‍🍳',
                        speech: 'Excelente! Tenho um cupom de 20% OFF para seu primeiro pedido. Quer aproveitar?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Pegar Cupom e Pedir', nextQuestionId: 'RESULT' }
                ],
                position: { x: 900, y: 100 }
            },
            // Fluxo Beleza
            {
                id: 'beleza-1',
                title: 'O que vamos transformar hoje?',
                description: 'Fluxo de Beleza - Passo 1',
                characters: [
                    {
                        id: 'char-s1',
                        name: 'Esteticista',
                        avatar: '/characters/library_2.png',
                        speech: 'Olá, querida! O que vamos fazer para realçar sua beleza hoje?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Cabelo (Corte/Cor)', nextQuestionId: 'beleza-2' },
                    { id: 'o2', text: 'Unhas (Manicure/Pedicure)', nextQuestionId: 'beleza-2' },
                    { id: 'o3', text: 'Estética Facial', nextQuestionId: 'beleza-2' }
                ],
                position: { x: 500, y: 400 }
            },
            {
                id: 'beleza-2',
                title: 'Agendamento VIP',
                description: 'Fluxo de Beleza - Passo 2',
                characters: [
                    {
                        id: 'char-s2',
                        name: 'Esteticista',
                        avatar: '/characters/library_2.png',
                        speech: 'Maravilhoso! Tenho alguns horários especiais com desconto. Vamos agendar?'
                    }
                ],
                options: [
                    { id: 'o1', text: 'Ver Horários Disponíveis', nextQuestionId: 'RESULT' }
                ],
                position: { x: 900, y: 400 }
            }
        ]
    }
];
