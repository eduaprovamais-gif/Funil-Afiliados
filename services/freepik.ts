

const API_KEY = import.meta.env.VITE_FREEPIK_API_KEY;
const BASE_URL = 'https://api.freepik.com/v1/resources';

export interface FreepikImage {
  id: number;
  title: string;
  image: {
    source: {
      url: string;
    };
  };
}

export const CATEGORIES = {
  MALE: 'Cartoon masculino 3d',
  FEMALE: 'Cartoon MULHER 3d',
  CHILD: 'Cartoon CRIANÇA 3d',
  ELDERLY: 'Cartoon IDOSO 3d',
  FITNESS: 'Cartoon FITNESS 3d',
  ANIMALS: 'Cartoon ANIMAIS 3d',
};

export async function searchImages(query: string, limit: number = 20): Promise<FreepikImage[]> {
  if (!API_KEY) {
    console.error('Freepik API Key is missing');
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}?locale=pt-BR&page=1&limit=${limit}&order=relevance&term=${encodeURIComponent(query)}`, {
      headers: {
        'Accept-Language': 'pt-BR',
        'x-freepik-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching images: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch images from Freepik:', error);
    return [];
  }
}
