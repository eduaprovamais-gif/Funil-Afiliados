import { useState } from 'react';
import { X, Image, Video, Link as LinkIcon, Instagram, Facebook, Youtube, MessageCircle, Globe, Zap, Clock, AlertCircle } from 'lucide-react';
import { ResultPage, SocialLink } from '../types';

interface ResultEditorProps {
    resultPage: ResultPage;
    onUpdate: (resultPage: ResultPage) => void;
    onClose: () => void;
}

const SOCIAL_PLATFORMS = [
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500' },
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
    { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'bg-red-600' },
    { value: 'tiktok', label: 'TikTok', icon: Video, color: 'bg-black' },
    { value: 'website', label: 'Website', icon: Globe, color: 'bg-purple-600' },
    { value: 'custom', label: 'Personalizado', icon: LinkIcon, color: 'bg-gray-600' },
] as const;

const CTA_STYLES = [
    { value: 'primary', label: 'Primário', preview: 'bg-blue-600 hover:bg-blue-700' },
    { value: 'success', label: 'Sucesso', preview: 'bg-green-600 hover:bg-green-700' },
    { value: 'warning', label: 'Urgência', preview: 'bg-orange-600 hover:bg-orange-700' },
    { value: 'gradient', label: 'Gradiente', preview: 'bg-gradient-to-r from-purple-600 to-pink-600' },
] as const;

export default function ResultEditor({ resultPage, onUpdate, onClose }: ResultEditorProps) {
    const [localResult, setLocalResult] = useState<ResultPage>(resultPage);

    const handleUpdate = (updates: Partial<ResultPage>) => {
        const updated = { ...localResult, ...updates };
        setLocalResult(updated);
        onUpdate(updated);
    };

    const addSocialLink = () => {
        const newLink: SocialLink = {
            platform: 'whatsapp',
            url: '',
            label: '',
        };
        handleUpdate({
            socialLinks: [...localResult.socialLinks, newLink],
        });
    };

    const updateSocialLink = (index: number, updates: Partial<SocialLink>) => {
        const newLinks = [...localResult.socialLinks];
        newLinks[index] = { ...newLinks[index], ...updates };
        handleUpdate({ socialLinks: newLinks });
    };

    const removeSocialLink = (index: number) => {
        handleUpdate({
            socialLinks: localResult.socialLinks.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border-2 border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Zap className="w-7 h-7" />
                            Página de Resultado Final
                        </h2>
                        <p className="text-purple-100 mt-1 text-base">
                            Configure a página que o lead verá ao completar o funil
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Título e Descrição */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-base font-bold text-white mb-2">
                                Título da Página
                            </label>
                            <input
                                type="text"
                                value={localResult.title}
                                onChange={(e) => handleUpdate({ title: e.target.value })}
                                placeholder="Ex: Parabéns! Seu resultado está pronto!"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-base font-bold text-white mb-2">
                                Descrição
                            </label>
                            <textarea
                                value={localResult.description}
                                onChange={(e) => handleUpdate({ description: e.target.value })}
                                placeholder="Descreva o que o lead receberá ou o próximo passo..."
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition resize-none"
                            />
                        </div>
                    </div>

                    {/* Mídia (Imagem ou Vídeo) */}
                    <div className="space-y-4">
                        <label className="block text-base font-bold text-white">
                            Mídia (Imagem ou Vídeo)
                        </label>

                        <div className="flex gap-3">
                            {(['none', 'image', 'video'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => handleUpdate({ mediaType: type, mediaUrl: type === 'none' ? undefined : localResult.mediaUrl })}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition font-bold text-base ${localResult.mediaType === type
                                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    {type === 'none' && 'Sem Mídia'}
                                    {type === 'image' && <><Image className="w-5 h-5 inline mr-2" />Imagem</>}
                                    {type === 'video' && <><Video className="w-5 h-5 inline mr-2" />Vídeo</>}
                                </button>
                            ))}
                        </div>

                        {localResult.mediaType !== 'none' && (
                            <div>
                                <input
                                    type="url"
                                    value={localResult.mediaUrl || ''}
                                    onChange={(e) => handleUpdate({ mediaUrl: e.target.value })}
                                    placeholder={`URL da ${localResult.mediaType === 'image' ? 'imagem' : 'vídeo (YouTube, Vimeo, etc.)'}`}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition"
                                />
                                <p className="text-sm text-slate-400 mt-2">
                                    {localResult.mediaType === 'image'
                                        ? '💡 Cole a URL de uma imagem hospedada (ex: Imgur, Cloudinary)'
                                        : '💡 Cole a URL do YouTube, Vimeo ou link direto do vídeo'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* CTA Principal */}
                    <div className="space-y-4 border-t border-slate-700 pt-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Botão de Ação (CTA)
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-base font-bold text-white mb-2">
                                    Texto do Botão
                                </label>
                                <input
                                    type="text"
                                    value={localResult.ctaText}
                                    onChange={(e) => handleUpdate({ ctaText: e.target.value })}
                                    placeholder="Ex: QUERO MEU PLANO AGORA!"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-base font-bold text-white mb-2">
                                    Link do Botão
                                </label>
                                <input
                                    type="url"
                                    value={localResult.ctaUrl}
                                    onChange={(e) => handleUpdate({ ctaUrl: e.target.value })}
                                    placeholder="https://seu-checkout.com"
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-base font-bold text-white mb-2">
                                Estilo do Botão
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {CTA_STYLES.map((style) => (
                                    <button
                                        key={style.value}
                                        onClick={() => handleUpdate({ ctaStyle: style.value })}
                                        className={`py-3 px-4 rounded-xl font-bold text-white text-base transition ${localResult.ctaStyle === style.value
                                                ? 'ring-4 ring-cyan-400 scale-105'
                                                : 'opacity-70 hover:opacity-100'
                                            } ${style.preview}`}
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Timer de Urgência */}
                    <div className="space-y-4 border-t border-slate-700 pt-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-400" />
                                Timer de Urgência (Opcional)
                            </h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localResult.showTimer || false}
                                    onChange={(e) => handleUpdate({ showTimer: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-600"></div>
                            </label>
                        </div>

                        {localResult.showTimer && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-base font-bold text-white mb-2">
                                        Tempo do Timer (minutos)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={localResult.timerMinutes || 10}
                                        onChange={(e) => handleUpdate({ timerMinutes: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-bold text-white mb-2">
                                        Texto de Urgência
                                    </label>
                                    <input
                                        type="text"
                                        value={localResult.urgencyText || ''}
                                        onChange={(e) => handleUpdate({ urgencyText: e.target.value })}
                                        placeholder="Ex: ⚠️ Oferta expira em:"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Links de Redes Sociais */}
                    <div className="space-y-4 border-t border-slate-700 pt-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">
                                Links de Redes Sociais
                            </h3>
                            <button
                                onClick={addSocialLink}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-base transition flex items-center gap-2"
                            >
                                <LinkIcon className="w-4 h-4" />
                                Adicionar Link
                            </button>
                        </div>

                        <div className="space-y-3">
                            {localResult.socialLinks.map((link, index) => {
                                const platform = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
                                const Icon = platform?.icon || LinkIcon;

                                return (
                                    <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={link.platform}
                                                onChange={(e) => updateSocialLink(index, { platform: e.target.value as any })}
                                                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-base focus:border-cyan-500 outline-none transition"
                                            >
                                                {SOCIAL_PLATFORMS.map((p) => (
                                                    <option key={p.value} value={p.value}>{p.label}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => removeSocialLink(index)}
                                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <input
                                            type="url"
                                            value={link.url}
                                            onChange={(e) => updateSocialLink(index, { url: e.target.value })}
                                            placeholder={`URL do ${platform?.label || 'link'}`}
                                            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-base placeholder-slate-500 focus:border-cyan-500 outline-none transition"
                                        />

                                        {link.platform === 'custom' && (
                                            <input
                                                type="text"
                                                value={link.label || ''}
                                                onChange={(e) => updateSocialLink(index, { label: e.target.value })}
                                                placeholder="Nome do link personalizado"
                                                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-base placeholder-slate-500 focus:border-cyan-500 outline-none transition"
                                            />
                                        )}
                                    </div>
                                );
                            })}

                            {localResult.socialLinks.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-base">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhum link adicionado ainda</p>
                                    <p className="text-sm mt-1">Clique em "Adicionar Link" para começar</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-950 p-6 border-t border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-base transition"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
