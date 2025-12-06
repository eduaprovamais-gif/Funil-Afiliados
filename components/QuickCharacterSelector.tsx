import React from 'react';
import { X } from 'lucide-react';
import { Character3DConfig } from '../types';
import { characterPresets } from '../data/characterPresets';

interface QuickCharacterSelectorProps {
    onSelect: (imageUrl: string, config3D: Character3DConfig) => void;
    onClose: () => void;
}

export default function QuickCharacterSelector({ onSelect, onClose }: QuickCharacterSelectorProps) {
    const handleSelectPreset = (preset: typeof characterPresets[0]) => {
        // Use emoji as temporary image until user can add real images
        onSelect(preset.thumbnail, preset.config);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0f1115] w-full max-w-6xl max-h-[90vh] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Escolha um Personagem</h2>
                        <p className="text-sm text-slate-400 mt-1">Selecione um personagem pronto com 1 clique</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Gallery Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {characterPresets.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => handleSelectPreset(preset)}
                                className="group relative bg-slate-900 border-2 border-slate-800 hover:border-purple-500 rounded-xl p-6 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 text-left"
                            >
                                {/* Emoji/Avatar */}
                                {/* Emoji/Avatar or Image */}
                                <div className="h-32 mb-4 flex items-center justify-center bg-slate-950/50 rounded-lg overflow-hidden">
                                    {preset.thumbnail.startsWith('/') ? (
                                        <img
                                            src={preset.thumbnail}
                                            alt={preset.name}
                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="text-6xl">{preset.thumbnail}</div>
                                    )}
                                </div>

                                {/* Name */}
                                <h3 className="text-lg font-bold text-white mb-2">{preset.name}</h3>

                                {/* Category Badge */}
                                <span className="inline-block px-2 py-1 bg-purple-600/20 text-purple-400 text-xs font-medium rounded-md mb-3">
                                    {preset.category}
                                </span>

                                {/* Quick Info */}
                                <div className="space-y-1 text-xs text-slate-400">
                                    <p>• {preset.config.genero}</p>
                                    <p>• {preset.config.tipoFisico}</p>
                                    <p>• {preset.config.cenario}</p>
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-center text-sm text-slate-400">
                    💡 Dica: Você pode personalizar o personagem depois de selecioná-lo
                </div>
            </div>
        </div>
    );
}
