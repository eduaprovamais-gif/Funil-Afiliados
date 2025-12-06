
import React, { useState, useEffect, useRef } from 'react';
import { Quiz, QuizCharacter } from '../types';
import { X, CheckCircle, ChevronRight, RefreshCw, MessageCircle, Lock, ShieldCheck, Zap, Play, Volume2, Maximize } from 'lucide-react';

interface QuizPreviewProps {
    quiz: Quiz;
    onClose: () => void;
}

const QuizPreview: React.FC<QuizPreviewProps> = ({ quiz, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [displayedBubbles, setDisplayedBubbles] = useState<QuizCharacter[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [showQuestion, setShowQuestion] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);

    const currentQuestion = quiz.questions[currentStep];
    const progress = ((currentStep + (isFinished ? 1 : 0)) / quiz.questions.length) * 100;

    useEffect(() => {
        // Reset state for new question
        setDisplayedBubbles([]);
        setShowQuestion(false);
        setIsTyping(true);

        const characters = currentQuestion?.characters || [];
        const timeouts: NodeJS.Timeout[] = [];

        // Logic to show characters sequentially
        let delay = 0;

        if (characters.length > 0) {
            characters.forEach((char, index) => {
                const typingDuration = Math.min(1500, char.speech.length * 40); // 40ms per char

                // Set typing for this character
                timeouts.push(setTimeout(() => {
                    setIsTyping(true);
                }, delay));

                // Finish typing and show bubble
                delay += typingDuration;
                timeouts.push(setTimeout(() => {
                    setIsTyping(false);
                    setDisplayedBubbles(prev => {
                        // Prevent duplicates by checking if id already exists
                        if (prev.some(p => p.id === char.id)) return prev;
                        return [...prev, char];
                    });
                }, delay));

                // Small pause between bubbles
                delay += 600;
            });
        } else {
            // Fallback delay if no characters
            delay = 800;
        }

        // Show main question after characters are done
        timeouts.push(setTimeout(() => {
            setIsTyping(false);
            setShowQuestion(true);
        }, delay));

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [currentStep, currentQuestion]);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [showQuestion, isTyping, displayedBubbles]);

    const handleOptionClick = (optionId: string) => {
        if (answers[currentQuestion.id]) return; // Prevent double click

        setAnswers({ ...answers, [currentQuestion.id]: optionId });

        // Smooth delay before next question
        setTimeout(() => {
            if (currentStep < quiz.questions.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                setIsFinished(true);
            }
        }, 600);
    };

    const restart = () => {
        setCurrentStep(0);
        setAnswers({});
        setIsFinished(false);
        setIsTyping(false);
        setShowQuestion(false);
        setDisplayedBubbles([]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 font-sans animate-in fade-in duration-300">
            {/* Phone Frame Mockup */}
            <div className="relative w-full max-w-[380px] h-[800px] max-h-[90vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-[8px] border-slate-900 ring-1 ring-white/20">

                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-2xl z-30 flex items-end justify-center pb-1">
                    <div className="w-12 h-1 bg-slate-800 rounded-full opacity-50"></div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-14 right-5 z-20 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors shadow-sm"
                >
                    <X className="w-4 h-4 text-slate-600" />
                </button>

                {/* Content */}
                <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
                    {/* Header/Progress */}
                    <div className="pt-14 pb-4 px-6 bg-white border-b border-slate-100 z-10 shadow-sm sticky top-0">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Analise em progresso</span>
                            <span className="text-[10px] font-bold text-slate-800">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-700 ease-in-out rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide pb-20 bg-[#f8fafc]">
                        {!isFinished ? (
                            <>
                                {/* Conversation Flow */}
                                <div className="flex flex-col gap-4">

                                    {/* Render Previous Character Bubbles */}
                                    {displayedBubbles.map((char, index) => {
                                        const isSameAsPrevious = index > 0 && displayedBubbles[index - 1].id === char.id;

                                        return (
                                            <div key={`${char.id}-${index}`} className={`flex gap-4 items-end animate-in fade-in slide-in-from-bottom-4 duration-500 ${isSameAsPrevious ? 'mt-2' : 'mt-6'}`}>
                                                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                                                    {!isSameAsPrevious && (
                                                        <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-3xl shadow-lg overflow-hidden relative transform transition-all duration-300 hover:scale-110">
                                                            {/* Fallback for simple emojis, but prepared for images */}
                                                            {char.avatar.startsWith('http') || char.avatar.startsWith('/') || char.avatar.startsWith('data:') ? (
                                                                <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                char.avatar
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1 max-w-[75%]">
                                                    {!isSameAsPrevious && (
                                                        <span className="text-xs text-slate-500 ml-2 font-medium">{char.name}</span>
                                                    )}
                                                    <div className={`bg-white px-5 py-4 shadow-md border border-slate-200 text-slate-700 text-base leading-relaxed ${isSameAsPrevious ? 'rounded-2xl' : 'rounded-2xl rounded-bl-sm'}`}>
                                                        {char.speech}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Typing Indicator */}
                                    {isTyping && (
                                        <div className="flex gap-3 items-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="w-10 h-10 rounded-full bg-slate-100/50 border border-slate-100 flex items-center justify-center text-lg shrink-0">
                                                ...
                                            </div>
                                            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actual Question */}
                                    {showQuestion && (
                                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-2">
                                            <div className="flex gap-3 items-end">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shadow-sm shrink-0 overflow-hidden">
                                                    {/* Use the last character's avatar if available, otherwise use quiz avatar */}
                                                    {(() => {
                                                        const activeAvatar = displayedBubbles.length > 0
                                                            ? displayedBubbles[displayedBubbles.length - 1].avatar
                                                            : quiz.avatar;

                                                        return activeAvatar.startsWith('http') || activeAvatar.startsWith('/') ? (
                                                            <img src={activeAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            activeAvatar
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex flex-col gap-1 max-w-[85%]">
                                                    {/* Description Bubble - Removed to prevent duplication */}
                                                    {/* {currentQuestion.description && (
                                                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none text-slate-600 text-sm leading-relaxed shadow-sm border border-slate-100">
                                                            {currentQuestion.description}
                                                        </div>
                                                    )} */}
                                                    {/* Main Title Bubble - Removed for fluid conversation */}
                                                    {/* <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-5 py-4 rounded-2xl rounded-tl-none text-white text-base font-medium shadow-md shadow-indigo-200">
                                                        {currentQuestion.title}
                                                    </div> */}
                                                </div>
                                            </div>

                                            {/* Options Area */}
                                            <div className="pl-12 space-y-2.5 mt-2">
                                                {currentQuestion.options.map((opt, idx) => {
                                                    const isSelected = answers[currentQuestion.id] === opt.id;
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => handleOptionClick(opt.id)}
                                                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 shadow-sm group active:scale-95 animate-in slide-in-from-bottom-2 fill-mode-backwards relative overflow-hidden ${isSelected ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'}`}
                                                            style={{ animationDelay: `${idx * 100}ms` }}
                                                        >
                                                            {/* Click Percentage Background Bar */}
                                                            {opt.clickPercentage && !isSelected && (
                                                                <div
                                                                    className="absolute left-0 top-0 bottom-0 bg-slate-50 transition-all duration-1000 ease-out -z-0"
                                                                    style={{ width: `${opt.clickPercentage}%` }}
                                                                />
                                                            )}

                                                            <div className="relative z-10">
                                                                {/* Option Image */}
                                                                {(opt.image?.startsWith('http') || opt.image?.startsWith('/')) && (
                                                                    <div className="mb-3 rounded-lg overflow-hidden h-32 bg-slate-100 border border-slate-100">
                                                                        <img src={opt.image} alt="Option" className="w-full h-full object-cover" />
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center justify-between">
                                                                    <span className={`font-medium text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{opt.text}</span>
                                                                    <div className="flex items-center gap-3">
                                                                        {opt.clickPercentage && (
                                                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                                {opt.clickPercentage}%
                                                                            </span>
                                                                        )}
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                                                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div ref={bottomRef}></div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // Results / VSL Page (American Model)
                            <div className="flex-1 flex flex-col items-center pt-2 text-center animate-in slide-in-from-bottom-8 duration-700 h-full">

                                {/* Headline */}
                                <h2 className="text-xl font-extrabold text-slate-900 mb-1 leading-tight px-4">
                                    {quiz.resultPage?.title ? (
                                        quiz.resultPage.title
                                    ) : (
                                        <><span className="text-red-600">ATENÇÃO:</span> Sua Análise Está Pronta!</>
                                    )}
                                </h2>
                                <p className="text-slate-600 mb-4 px-4 text-xs leading-relaxed">
                                    {quiz.resultPage?.description || 'Assista ao vídeo curto abaixo para entender o seu resultado.'}
                                </p>

                                {/* VSL Mockup (Fake Video Player) */}
                                <div className="w-full max-w-[340px] aspect-video bg-black rounded-xl shadow-lg relative mb-6 group cursor-pointer border-2 border-slate-800 overflow-hidden">
                                    {quiz.resultPage?.mediaUrl ? (
                                        <iframe
                                            src={quiz.resultPage.mediaUrl.replace('watch?v=', 'embed/')}
                                            className="w-full h-full"
                                            title="Video"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                                                </div>
                                            </div>
                                            {/* Fake Controls */}
                                            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent flex items-center px-3 justify-between pointer-events-none">
                                                <div className="flex items-center gap-2">
                                                    <Play className="w-3 h-3 text-white fill-white" />
                                                    <Volume2 className="w-3 h-3 text-white" />
                                                    <span className="text-[10px] text-white font-mono">00:00 / 03:45</span>
                                                </div>
                                                <Maximize className="w-3 h-3 text-white" />
                                            </div>
                                            {/* Fake Progress Bar */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                                <div className="h-full w-1/3 bg-red-600"></div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="w-full bg-white p-4 rounded-xl mb-4 border border-slate-100 shadow-sm mx-auto max-w-[320px]">
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compatibilidade</span>
                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Alta</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-sm shadow-sm">
                                            {quiz.avatar}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-[10px] font-semibold text-slate-700">Seu Perfil</span>
                                                <span className="text-[10px] font-bold text-indigo-600">98%</span>
                                            </div>
                                            <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 w-[98%] rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Section */}
                                <div className="w-full mt-auto bg-slate-900 text-white p-6 rounded-t-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-full duration-700 delay-500 relative overflow-hidden">
                                    {/* Scarcity Banner */}
                                    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider animate-pulse">
                                        Oferta expira em 10:00
                                    </div>

                                    <div className="flex items-center justify-center gap-2 mb-3 mt-4 text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                                        <Lock className="w-3 h-3" /> Acesso Liberado
                                    </div>

                                    <a
                                        href={quiz.resultPage?.ctaUrl || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full block py-4 rounded-xl font-bold text-white shadow-lg shadow-green-500/30 transform transition-transform hover:-translate-y-1 active:translate-y-0 text-base relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 border-t border-white/20 animate-pulse"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {quiz.resultPage?.ctaText || 'QUERO MEU PLANO'} <ChevronRight className="w-5 h-5" />
                                        </span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    </a>

                                    <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                                        <ShieldCheck className="w-3 h-3" />
                                        <span>Ambiente 100% Seguro</span>
                                    </div>

                                    <button onClick={restart} className="mt-4 flex items-center justify-center gap-2 text-[10px] font-medium text-slate-500 hover:text-white transition-colors w-full">
                                        <RefreshCw className="w-3 h-3" /> Refazer teste
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Branding Footer */}
                <div className="p-3 bg-white border-t border-slate-100 text-center z-10">
                    <p className="text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1 uppercase tracking-widest">
                        <MessageCircle className="w-3 h-3" /> Powered by XQuiz
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuizPreview;
