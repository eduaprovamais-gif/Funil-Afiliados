import { Character3DConfig } from '../types';

export interface CharacterPreset {
    id: string;
    name: string;
    thumbnail: string; // emoji or URL
    config: Character3DConfig;
    category: string;
}

export const characterPresets: CharacterPreset[] = [
    // EDUCAÇÃO & PROFISSIONAL
    {
        id: 'professora',
        name: 'Professora',
        thumbnail: '/characters/char1.jpg',
        category: 'Educação',
        config: {
            personagem: 'Professora simpática',
            genero: 'Feminino',
            idade: '30 anos',
            nicho: 'Educação',
            tipoFisico: 'Normal',
            roupa: 'Camisa azul',
            acessorios: 'Óculos',
            cores: 'Azul e branco',
            expressao: 'Sorrindo',
            pose: 'Frente',
            cenario: 'Sala de aula'
        }
    },
    {
        id: 'estudante-focada',
        name: 'Estudante Focada',
        thumbnail: '/characters/char2.jpg',
        category: 'Educação',
        config: {
            personagem: 'Estudante dedicada',
            genero: 'Feminino',
            idade: '25 anos',
            nicho: 'Educação',
            tipoFisico: 'Normal',
            roupa: 'Camisa cinza',
            acessorios: 'Óculos, Mochila',
            cores: 'Cinza e branco',
            expressao: 'Atenta',
            pose: 'Frente',
            cenario: 'Biblioteca'
        }
    },

    // TECNOLOGIA & MARKETING
    {
        id: 'desenvolvedor',
        name: 'Desenvolvedor',
        thumbnail: '/characters/char3.jpg',
        category: 'Tecnologia',
        config: {
            personagem: 'Desenvolvedor web',
            genero: 'Masculino',
            idade: '28 anos',
            nicho: 'Tecnologia',
            tipoFisico: 'Normal',
            roupa: 'Camisa social azul clara',
            acessorios: 'Óculos, Laptop',
            cores: 'Azul e branco',
            expressao: 'Sorrindo',
            pose: 'Sentado com laptop',
            cenario: 'Escritório moderno'
        }
    },

    // BELEZA & CRIATIVIDADE
    {
        id: 'criativa',
        name: 'Designer Criativa',
        thumbnail: '/characters/char4.jpg',
        category: 'Beleza',
        config: {
            personagem: 'Designer criativa',
            genero: 'Feminino',
            idade: '26 anos',
            nicho: 'Beleza',
            tipoFisico: 'Normal',
            roupa: 'Vestido amarelo',
            acessorios: 'Brincos grandes',
            cores: 'Amarelo e preto',
            expressao: 'Radiante',
            pose: 'Frente',
            cenario: 'Estúdio'
        }
    },

    // OUTROS PRESETS (Mapeados para as imagens existentes)
    {
        id: 'consultor-vendas',
        name: 'Consultor de Vendas',
        thumbnail: '/characters/char3.jpg', // Reusing Developer (Male Professional)
        category: 'Vendas',
        config: {
            personagem: 'Consultor de vendas profissional',
            genero: 'Masculino',
            idade: '35 anos',
            nicho: 'Vendas',
            tipoFisico: 'Normal',
            roupa: 'Terno azul marinho',
            acessorios: 'Gravata, Relógio',
            cores: 'Azul e branco',
            expressao: 'Confiante e sorrindo',
            pose: 'Braços cruzados',
            cenario: 'Cenário de escritório'
        }
    },
    {
        id: 'personal-trainer',
        name: 'Personal Trainer',
        thumbnail: '/characters/char3.jpg', // Reusing Developer (Male) - Placeholder
        category: 'Musculação',
        config: {
            personagem: 'Personal trainer motivador',
            genero: 'Masculino',
            idade: '28 anos',
            nicho: 'Musculação',
            tipoFisico: 'Musculoso',
            roupa: 'Regata preta e shorts',
            acessorios: 'Relógio esportivo, Garrafa',
            cores: 'Preto e vermelho',
            expressao: 'Motivado e energético',
            pose: 'Mostrando bíceps',
            cenario: 'Academia'
        }
    },
    {
        id: 'nutricionista',
        name: 'Nutricionista',
        thumbnail: '/characters/char1.jpg', // Reusing Teacher (Female Professional)
        category: 'Emagrecimento',
        config: {
            personagem: 'Nutricionista especialista',
            genero: 'Feminino',
            idade: '32 anos',
            nicho: 'Emagrecimento',
            tipoFisico: 'Fitness',
            roupa: 'Jaleco branco',
            acessorios: 'Prancheta, Caneta',
            cores: 'Branco e verde',
            expressao: 'Amigável e confiável',
            pose: 'Segurando prancheta',
            cenario: 'Consultório'
        }
    },
    {
        id: 'esteticista',
        name: 'Esteticista',
        thumbnail: '/characters/char4.jpg', // Reusing Designer (Female Creative)
        category: 'Estética',
        config: {
            personagem: 'Esteticista profissional',
            genero: 'Feminino',
            idade: '27 anos',
            nicho: 'Estética',
            tipoFisico: 'Normal',
            roupa: 'Uniforme rosa claro',
            acessorios: 'Luvas, Máscara',
            cores: 'Rosa e branco',
            expressao: 'Delicada e profissional',
            pose: 'Mãos juntas',
            cenario: 'Consultório'
        }
    },
    {
        id: 'advogado',
        name: 'Advogado',
        thumbnail: '/characters/char3.jpg', // Reusing Developer (Male Professional)
        category: 'Advocacia',
        config: {
            personagem: 'Advogado experiente',
            genero: 'Masculino',
            idade: '40 anos',
            nicho: 'Advocacia',
            tipoFisico: 'Normal',
            roupa: 'Terno preto clássico',
            acessorios: 'Óculos, Pasta',
            cores: 'Preto e cinza',
            expressao: 'Sério e confiável',
            pose: 'Braços cruzados',
            cenario: 'Cenário de escritório'
        }
    },
    {
        id: 'veterinario',
        name: 'Veterinário',
        thumbnail: '/characters/char1.jpg', // Reusing Teacher (Female Professional)
        category: 'Animais',
        config: {
            personagem: 'Veterinário carinhoso',
            genero: 'Feminino',
            idade: '29 anos',
            nicho: 'Animais',
            tipoFisico: 'Normal',
            roupa: 'Jaleco azul claro',
            acessorios: 'Estetoscópio',
            cores: 'Azul claro e branco',
            expressao: 'Carinhosa e atenciosa',
            pose: 'Segurando estetoscópio',
            cenario: 'Consultório'
        }
    },
    {
        id: 'jovem-empreendedor',
        name: 'Jovem Empreendedor',
        thumbnail: '/characters/char3.jpg', // Reusing Developer
        category: 'Marketing',
        config: {
            personagem: 'Jovem empreendedor inovador',
            genero: 'Masculino',
            idade: '25 anos',
            nicho: 'Marketing',
            tipoFisico: 'Normal',
            roupa: 'Camisa casual e jeans',
            acessorios: 'Laptop, Fones',
            cores: 'Casual e moderno',
            expressao: 'Entusiasmado e criativo',
            pose: 'Apontando para frente',
            cenario: 'Cenário urbano'
        }
    },
    {
        id: 'cabeleireira',
        name: 'Cabeleireira',
        thumbnail: '/characters/char4.jpg', // Reusing Designer
        category: 'Beleza',
        config: {
            personagem: 'Cabeleireira criativa',
            genero: 'Feminino',
            idade: '25 anos',
            nicho: 'Beleza',
            tipoFisico: 'Normal',
            roupa: 'Avental preto estiloso',
            acessorios: 'Tesoura, Pente',
            cores: 'Preto e dourado',
            expressao: 'Criativa e animada',
            pose: 'Segurando tesoura',
            cenario: 'Loja'
        }
    }
];

export const getPresetsByCategory = (category: string): CharacterPreset[] => {
    return characterPresets.filter(p => p.category === category);
};

export const getAllCategories = (): string[] => {
    return Array.from(new Set(characterPresets.map(p => p.category)));
};
