
export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean; // Optional for lead gen quizzes, mandatory for trivia
  nextQuestionId?: string; // ID of the next question or 'RESULT'
  clickPercentage?: number; // Optional social proof percentage (0-100)
  image?: string; // Optional image URL/path for the option
}

export interface Character3DConfig {
  personagem: string; // Custom character type description
  genero: 'Masculino' | 'Feminino' | 'Criança' | 'Idoso';
  idade?: string; // Optional age specification
  nicho: 'Marketing' | 'Beleza' | 'Musculação' | 'Advocacia' | 'Vendas' | 'Tatuagem' | 'Estética' | 'Emagrecimento' | 'Animais' | 'Emojis' | 'Educação' | 'Tecnologia';
  tipoFisico: 'Fitness' | 'Musculoso' | 'Normal' | 'Plus Size';
  roupa: string; // Clothing description
  acessorios: string; // Accessories description
  cores: string; // Color palette
  expressao: string; // Facial expression
  pose: string; // Body position
  cenario: string; // Background/scenario type
}

export interface QuizCharacter {
  id: string;
  name: string;
  avatar: string; // Emoji or URL
  speech: string; // The text bubble content
  config3D?: Character3DConfig; // Optional 3D character configuration
}

export interface SocialLink {
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'website' | 'custom';
  url: string;
  label?: string;
}

export interface ResultPage {
  title: string;
  description: string;
  mediaType: 'none' | 'image' | 'video';
  mediaUrl?: string;
  ctaText: string;
  ctaUrl: string;
  ctaStyle: 'primary' | 'success' | 'warning' | 'gradient';
  socialLinks: SocialLink[];
  showTimer?: boolean;
  timerMinutes?: number;
  urgencyText?: string;
}

export interface Question {
  id: string;
  title: string;
  description?: string;
  characters?: QuizCharacter[]; // Array of characters speaking in this step
  options: Option[];
  position?: { x: number; y: number };
  imageUrl?: string; // URL da imagem do card
  videoUrl?: string; // URL do vídeo (YouTube/Vimeo)
  linkUrl?: string; // URL do link/CTA
  linkText?: string; // Texto do botão de link
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  themeColor: string;
  avatar: string; // Default/Global avatar
  tone?: string;
  settings?: QuizSettings;
  resultPage?: ResultPage; // Página de resultado final
}

export interface QuizSettings {
  customDomain?: string;
  webhookUrl?: string;
  facebookPixel?: string;
  googlePixel?: string;
}

export type ViewState = 'LANDING' | 'BUILDER' | 'PREVIEW';
