import React, { useState } from 'react';
import { X, Search, Upload, Users } from 'lucide-react';

interface CharacterLibraryItem {
    id: string;
    name: string;
    thumbnail: string;
    category: string;
}

interface CharacterLibraryProps {
    onSelect: (imageUrl: string) => void;
    onClose: () => void;
}

const characterLibrary: CharacterLibraryItem[] = [
    { id: 'lib-1', name: 'Professor Sábio', thumbnail: '/characters/library_1.png', category: 'Educação' },
    { id: 'lib-2', name: 'Atleta Fitness', thumbnail: '/characters/library_2.png', category: 'Fitness' },
    { id: 'lib-3', name: 'Mãe Gestante', thumbnail: '/characters/library_3.png', category: 'Saúde' },
    { id: 'lib-4', name: 'Personal Trainer', thumbnail: '/characters/library_4.png', category: 'Fitness' },
    { id: 'lib-5', name: 'Empresário', thumbnail: '/characters/library_5.png', category: 'Negócios' },
];

const CharacterLibrary: React.FC<CharacterLibraryProps> = ({ onSelect, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

    const categories = ['Todos', ...Array.from(new Set(characterLibrary.map(c => c.category)))];

    const filteredCharacters = characterLibrary.filter(char => {
        const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || char.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Biblioteca de Personagens</h2>
                            <p className="text-sm text-slate-400">Escolha um personagem para adicionar ao fluxo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="p-6 border-b border-slate-800 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar personagem..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Character Grid */}
                <div className="p-6 max-h-[500px] overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredCharacters.map(char => (
                            <button
                                key={char.id}
                                onClick={() => {
                                    onSelect(char.thumbnail);
                                    onClose();
                                }}
                                className="group relative bg-slate-800 border-2 border-slate-700 rounded-xl overflow-hidden hover:border-sky-500 transition-all duration-300 hover:scale-105"
                            >
                                <div className="aspect-[3/4] relative">
                                    <img
                                        src={char.thumbnail}
                                        alt={char.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                                    <h3 className="text-sm font-bold text-white line-clamp-1">{char.name}</h3>
                                    <p className="text-xs text-slate-400">{char.category}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {filteredCharacters.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-500">Nenhum personagem encontrado</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-950">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            {filteredCharacters.length} personagen{filteredCharacters.length !== 1 ? 's' : ''} disponíve{filteredCharacters.length !== 1 ? 'is' : 'l'}
                        </p>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
                            <Upload className="w-4 h-4" />
                            Upload Personalizado
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterLibrary;
