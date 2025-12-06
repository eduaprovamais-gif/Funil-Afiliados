import React, { useState, useEffect } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { CATEGORIES, searchImages, FreepikImage } from '../services/freepik';

interface ImageSelectorProps {
    onSelect: (imageUrl: string) => void;
    onClose: () => void;
}

export default function ImageSelector({ onSelect, onClose }: ImageSelectorProps) {
    const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES>('MALE');
    const [images, setImages] = useState<FreepikImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadImages(CATEGORIES[activeCategory]);
    }, [activeCategory]);

    const loadImages = async (query: string) => {
        setLoading(true);
        try {
            const results = await searchImages(query);
            setImages(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            loadImages(searchQuery);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-xl flex flex-col border border-slate-700">

                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Selecionar Imagem</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Categories & Search */}
                <div className="p-4 border-b border-slate-700 space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                {cat === 'MALE' ? 'Homens' :
                                    cat === 'FEMALE' ? 'Mulheres' :
                                        cat === 'CHILD' ? 'Crianças' :
                                            cat === 'ELDERLY' ? 'Idosos' :
                                                cat === 'FITNESS' ? 'Fitness' : 'Animais'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Buscar outra coisa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    </form>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {images.map((img) => (
                                <button
                                    key={img.id}
                                    onClick={() => onSelect(img.image.source.url)}
                                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-all"
                                >
                                    <img
                                        src={img.image.source.url}
                                        alt={img.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
