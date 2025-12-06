import { Quiz } from '../types';

export const demoQuiz: Quiz = {
    id: 'demo-quiz-1',
    title: 'Quiz de Perfil - Fitness & Saúde',
    description: 'Descubra seu perfil ideal de treino',
    themeColor: '#0ea5e9',
    avatar: '/characters/library_2.png',
    questions: [
        {
            id: 'q1',
            title: 'Qual é seu objetivo principal?',
            description: 'Vamos entender o que você busca',
            position: { x: 250, y: 100 },
            characters: [
                {
                    id: 'char-1',
                    name: 'Personal Trainer',
                    avatar: '/characters/library_4.png',
                    speech: 'Olá! Sou seu personal trainer virtual. Vou te ajudar a encontrar o treino perfeito para você! 💪'
                },
                {
                    id: 'char-2',
                    name: 'Personal Trainer',
                    avatar: '/characters/library_4.png',
                    speech: 'Primeiro, me conta: qual é o seu objetivo principal com os treinos?'
                }
            ],
            options: [
                {
                    id: 'opt-1-1',
                    text: 'Perder peso e definir',
                    nextQuestionId: 'q2',
                    clickPercentage: 45,
                    image: ''
                },
                {
                    id: 'opt-1-2',
                    text: 'Ganhar massa muscular',
                    nextQuestionId: 'q2',
                    clickPercentage: 35,
                    image: ''
                },
                {
                    id: 'opt-1-3',
                    text: 'Melhorar saúde geral',
                    nextQuestionId: 'q2',
                    clickPercentage: 20,
                    image: ''
                }
            ]
        },
        {
            id: 'q2',
            title: 'Qual sua experiência com exercícios?',
            description: '',
            position: { x: 600, y: 100 },
            characters: [
                {
                    id: 'char-3',
                    name: 'Atleta Fitness',
                    avatar: '/characters/library_2.png',
                    speech: 'Ótima escolha! Agora me conta: você já treina regularmente ou está começando agora?'
                }
            ],
            options: [
                {
                    id: 'opt-2-1',
                    text: 'Iniciante (nunca treinei)',
                    nextQuestionId: 'q3',
                    clickPercentage: 40,
                    image: ''
                },
                {
                    id: 'opt-2-2',
                    text: 'Intermediário (treino há meses)',
                    nextQuestionId: 'q3',
                    clickPercentage: 45,
                    image: ''
                },
                {
                    id: 'opt-2-3',
                    text: 'Avançado (treino há anos)',
                    nextQuestionId: 'q3',
                    clickPercentage: 15,
                    image: ''
                }
            ]
        },
        {
            id: 'q3',
            title: 'Quantos dias por semana você pode treinar?',
            description: '',
            position: { x: 950, y: 100 },
            characters: [
                {
                    id: 'char-4',
                    name: 'Professor',
                    avatar: '/characters/library_1.png',
                    speech: 'Perfeito! Estamos quase lá. Para montar seu plano ideal, preciso saber: quantos dias por semana você consegue dedicar aos treinos?'
                }
            ],
            options: [
                {
                    id: 'opt-3-1',
                    text: '2-3 dias por semana',
                    nextQuestionId: 'RESULT',
                    clickPercentage: 30,
                    image: ''
                },
                {
                    id: 'opt-3-2',
                    text: '4-5 dias por semana',
                    nextQuestionId: 'RESULT',
                    clickPercentage: 50,
                    image: ''
                },
                {
                    id: 'opt-3-3',
                    text: '6-7 dias por semana',
                    nextQuestionId: 'RESULT',
                    clickPercentage: 20,
                    image: ''
                }
            ]
        }
    ]
};
