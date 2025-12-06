import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    MarkerType,
    Connection,
    Edge,
    Node,
    Handle,
    Position,
    Panel,
    BackgroundVariant,
    ReactFlowInstance,
    NodeResizer
} from 'reactflow';
import { Quiz, Question, Option, QuizCharacter, Character3DConfig } from '../types';
import { premiumTemplates } from '../data/premiumTemplates';
import {
    Plus, Trash2, Save, Play, ChevronLeft, Sparkles,
    Settings, MessageSquare, Layout, Type, MousePointer2,
    X, Loader2, Search, ChevronRight, UserPlus, Users, Folder, Download, Upload, Globe, Sliders, Zap, Crown, Lock,
    Copy, Image, Video, Link, CheckCircle
} from 'lucide-react';
import QuizPreview from './QuizPreview';
import ImageSelector from './ImageSelector';
import QuickCharacterSelector from './QuickCharacterSelector';
import CharacterLibrary from './CharacterLibrary';
import { GoogleGenAI } from "@google/genai";
import { saveQuiz, publishQuiz } from '../services/quizService';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

interface QuizBuilderProps {
    quiz: Quiz;
    setQuiz: (quiz: Quiz) => void;
    onExit: () => void;
}

// --- Custom Node Component ---
const QuestionNode = ({ data, selected, id }: any) => {
    return (
        <div className={`bg-slate-900 border-2 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden select-none ${selected ? 'border-cyan-400 ring-4 ring-cyan-400/40 shadow-cyan-500/30 scale-105' : 'border-slate-800 hover:border-slate-600'}`} style={{ minWidth: 260, minHeight: 150 }}>
            {/* NodeResizer for resizable cards */}
            <NodeResizer
                minWidth={200}
                minHeight={150}
                isVisible={selected}
                handleStyle={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#06b6d4',
                    border: '2px solid #0f172a'
                }}
            />

            {/* Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-start gap-3 relative">
                {/* Render Character Avatars Stacked */}
                <div className="flex -space-x-3 overflow-hidden shrink-0">
                    {data.characters && data.characters.length > 0 ? (
                        data.characters.slice(0, 3).map((char: QuizCharacter) => (
                            <div key={char.id} className="inline-block h-14 w-14 rounded-full ring-2 ring-slate-900 bg-slate-800 flex items-center justify-center text-2xl border-2 border-slate-700 overflow-hidden shadow-lg" title={char.speech}>
                                {char.avatar.startsWith('http') || char.avatar.startsWith('/') || char.avatar.startsWith('data:') ? (
                                    <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                                ) : (
                                    char.avatar
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800 text-2xl border-2 border-slate-700 shadow-lg">
                            {data.avatar || '🤖'}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-extrabold text-white line-clamp-2 leading-tight tracking-tight">{data.label}</h3>
                    {data.description && (
                        <p className="text-sm text-slate-400 mt-1.5 line-clamp-2 font-medium">{data.description}</p>
                    )}
                    {data.characters && data.characters.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="bg-slate-800/80 px-2 py-1 rounded-md flex items-center gap-1.5 border border-slate-700">
                                <MessageSquare className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs text-cyan-100 font-bold uppercase tracking-wide">{data.characters.length} FALAS</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Duplicate Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('Duplicate clicked for:', id, 'has handler:', !!data.onDuplicate);
                        if (data.onDuplicate) {
                            data.onDuplicate(id);
                        } else {
                            console.warn('No onDuplicate handler for node:', id);
                        }
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-400 hover:text-white transition-all border border-slate-700 hover:border-purple-400 shadow-lg"
                    title="Duplicar card"
                >
                    <Copy className="w-4 h-4" />
                </button>

                {/* Settings Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.onEditClick) {
                            data.onEditClick(id);
                        }
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-400 hover:text-white transition-all border border-slate-700 hover:border-cyan-400 shadow-lg"
                    title="Editar propriedades"
                >
                    <Settings className="w-4 h-4" />
                </button>

                <Handle
                    type="target"
                    position={Position.Left}
                    className="!bg-cyan-400 !w-5 !h-5 !-left-[11px] !border-4 !border-slate-900 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Media Content */}
            {(data.imageUrl || data.videoUrl) && (
                <div className="relative w-full h-40 bg-slate-950 border-b border-slate-800 group">
                    {data.videoUrl ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                            <Play className="w-12 h-12 text-slate-700" />
                            <span className="absolute bottom-2 right-2 text-[10px] bg-black/50 px-2 py-1 rounded text-white">VÍDEO</span>
                        </div>
                    ) : (
                        <img src={data.imageUrl} alt="Card Media" className="w-full h-full object-cover" />
                    )}
                </div>
            )}

            {/* Link/CTA Preview */}
            {data.linkUrl && (
                <div className="px-4 pt-4">
                    <div className="w-full py-2 bg-emerald-900/20 border border-emerald-900/50 rounded-lg flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wide">
                        <Link className="w-3 h-3" /> {data.linkText || 'Link de Ação'}
                    </div>
                </div>
            )}

            {/* Content / Options */}
            <div className="p-4 space-y-2 bg-[#0f1115]">
                {data.options.map((opt: Option, idx: number) => (
                    <div key={opt.id} className="relative group">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-cyan-500 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 transform hover:-translate-y-0.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-sm font-extrabold text-white border border-slate-600 mr-3 shadow-md group-hover:bg-cyan-600 group-hover:border-cyan-400 transition-colors">
                                {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-sm text-slate-200 font-semibold flex-1 truncate">{opt.text}</span>
                        </div>
                        {/* Output Handle for this specific option */}
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={opt.id}
                            className="!bg-slate-600 group-hover:!bg-cyan-400 !w-4 !h-4 !-right-[9px] transition-all !border-2 !border-slate-900 group-hover:shadow-[0_0_10px_rgba(34,211,238,1)]"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                ))}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onAddOption();
                    }}
                    className="w-full py-3 text-sm font-bold text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                    <Plus className="w-4 h-4" /> Adicionar Opção
                </button>
            </div>
        </div>
    );
};

// Define nodeTypes OUTSIDE the component to prevent re-creation on every render
const nodeTypes = { questionNode: QuestionNode };

const QuizBuilder: React.FC<QuizBuilderProps> = ({ quiz, setQuiz, onExit }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [showImageSelector, setShowImageSelector] = useState(false);
    const [showCharacterCreator, setShowCharacterCreator] = useState(false);
    const [showCharacterLibrary, setShowCharacterLibrary] = useState(false);
    const [showProjectsSidebar, setShowProjectsSidebar] = useState(false);
    const [showSettingsSidebar, setShowSettingsSidebar] = useState(false);
    const [activeCharIndex, setActiveCharIndex] = useState<number | null>(null);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [showPremiumSidebar, setShowPremiumSidebar] = useState(false); // New State
    const [isPremium, setIsPremium] = useState(false); // Mock Premium State

    // Save/Publish functionality
    const { user } = useAuth();
    const { subscription, canCreateQuiz } = useSubscription();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [quizId, setQuizId] = useState<string | null>(null);

    // Template Import Logic
    const loadTemplate = (template: Quiz) => {
        if (confirm(`Deseja substituir o projeto atual pelo template "${template.title}"? Isso apagará o trabalho não salvo.`)) {
            // Map template nodes to React Flow nodes
            const newNodes: Node[] = template.questions.map((q) => ({
                id: q.id,
                type: 'questionNode',
                position: q.position || { x: 0, y: 0 },
                data: {
                    label: q.title,
                    description: q.description,
                    characters: q.characters,
                    avatar: template.avatar,
                    options: q.options,
                    onAddOption: () => addOptionToNode(q.id),
                    onEditClick: (id: string) => setActiveNodeId(id),
                },
            }));

            // Map template edges
            const newEdges: Edge[] = [];
            template.questions.forEach((q) => {
                q.options.forEach((opt) => {
                    if (opt.nextQuestionId && opt.nextQuestionId !== 'RESULT') {
                        newEdges.push({
                            id: `e-${q.id}-${opt.id}`,
                            source: q.id,
                            sourceHandle: opt.id,
                            target: opt.nextQuestionId,
                            type: 'smoothstep',
                            animated: true,
                            style: {
                                stroke: '#22d3ee',
                                strokeWidth: 4,
                                filter: 'drop-shadow(0 0 3px rgba(34,211,238,0.5))'
                            },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#22d3ee',
                                width: 20,
                                height: 20
                            }
                        });
                    }
                });
            });

            setQuiz({ ...template, id: `proj-${Date.now()}` }); // Create new ID
            setNodes(newNodes);
            setEdges(newEdges);
            setShowPremiumSidebar(false);
        }
    };

    // Save Quiz Function
    const handleSave = async () => {
        if (!user) {
            showToast('Você precisa estar logado para salvar', 'error');
            return;
        }
        setIsSaving(true);
        try {
            // Sincronizar posições dos nodes antes de salvar
            const updatedQuestions = quiz.questions.map(q => {
                const node = nodes.find(n => n.id === q.id);
                return {
                    ...q,
                    position: node ? node.position : (q.position || { x: 0, y: 0 })
                };
            });

            const quizToSave = { ...quiz, questions: updatedQuestions };

            const result = await saveQuiz({ userId: user.id, quiz: quizToSave, quizId: quizId || undefined });

            if (!result.success) throw result.error;

            if (result.quiz) {
                setQuizId(result.quiz.id);
                showToast('Funil salvo com sucesso!', 'success');
            }
        } catch (error: any) {
            console.error('Error saving quiz:', error);
            showToast(error.message || 'Erro ao salvar funil', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    // Publish Quiz Function
    const handlePublish = async () => {
        if (!user) {
            showToast('Você precisa estar logado', 'error');
            return;
        }
        if (!quizId) {
            showToast('Salve o funil antes de publicar', 'warning');
            await handleSave();
            return;
        }
        setIsPublishing(true);
        try {
            const result = await publishQuiz({ quizId });

            if (!result.success) throw result.error;

            if (result.url) {
                showToast(`Funil publicado! URL copiada para área de transferência`, 'success');

                // Copy URL to clipboard
                navigator.clipboard.writeText(result.url);
            }
        } catch (error: any) {
            console.error('Error publishing quiz:', error);
            showToast(error.message || 'Erro ao publicar funil', 'error');
        } finally {
            setIsPublishing(false);
        }
    };

    // AI State
    const [aiTopic, setAiTopic] = useState('');
    const [aiTone, setAiTone] = useState('Curioso');
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');

    // React Flow State
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const charImageInputRef = useRef<HTMLInputElement>(null);
    const [uploadingCharIndex, setUploadingCharIndex] = useState<number | null>(null);

    // --- Initialization ---
    useEffect(() => {
        if (quiz.questions.length > 0) {
            const initialNodes: Node[] = quiz.questions.map((q) => ({
                id: q.id,
                type: 'questionNode',
                position: q.position || { x: 0, y: 0 },
                data: {
                    label: q.title,
                    description: q.description,
                    characters: q.characters,
                    avatar: quiz.avatar,
                    options: q.options,
                    onAddOption: () => addOptionToNode(q.id),
                    onEditClick: (id: string) => setActiveNodeId(id), // Pass edit handler
                },
            }));

            const initialEdges: Edge[] = [];
            quiz.questions.forEach((q) => {
                q.options.forEach((opt) => {
                    if (opt.nextQuestionId && opt.nextQuestionId !== 'RESULT') {
                        initialEdges.push({
                            id: `e-${q.id}-${opt.id}`,
                            source: q.id,
                            sourceHandle: opt.id,
                            target: opt.nextQuestionId,
                            type: 'smoothstep',
                            animated: true,
                            style: {
                                stroke: '#22d3ee', // Cyan-400
                                strokeWidth: 4,
                                filter: 'drop-shadow(0 0 3px rgba(34,211,238,0.5))'
                            },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#22d3ee',
                                width: 20,
                                height: 20
                            }
                        });
                    }
                });
            });

            setNodes(initialNodes);
            setEdges(initialEdges);
        }
    }, [quiz]);

    // --- Keyboard Delete Handler ---
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.key === 'Delete' || event.key === 'Backspace') && activeNodeId) {
                // Prevent backspace from navigating back if not in an input
                const activeElement = document.activeElement;
                const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;

                if (!isInput) {
                    event.preventDefault();
                    deleteActiveNode();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeNodeId]);

    // Initial State Setup from Quiz Data
    // const initialNodes: Node[] = useMemo(() => {
    //     if (quiz.questions.length === 0) return [];
    //     return quiz.questions.map((q, index) => ({
    //         id: q.id,
    //         type: 'questionNode',
    //         position: q.position || { x: 250 + (index * 350), y: 100 + (index * 50) }, // Staggered default
    //         data: {
    //             label: q.title,
    //             description: q.description,
    //             avatar: quiz.avatar,
    //             characters: q.characters,
    //             options: q.options,
    //             // Helper functions passed to node data
    //             onAddOption: () => addOptionToNode(q.id),
    //             onEditClick: (nodeId: string) => setActiveNodeId(nodeId)
    //         }
    //     }));
    // }, [quiz.questions, quiz.avatar]);

    // const initialEdges: Edge[] = useMemo(() => {
    //     const edges: Edge[] = [];
    //     quiz.questions.forEach(q => {
    //         q.options.forEach(opt => {
    //             if (opt.nextQuestionId && opt.nextQuestionId !== 'RESULT') {
    //                 edges.push({
    //                     id: `e-${q.id}-${opt.id}`,
    //                     source: q.id,
    //                     sourceHandle: opt.id,
    //                     target: opt.nextQuestionId,
    //                     animated: true,
    //                     style: { stroke: '#64748b' },
    //                     markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
    //                 });
    //             }
    //         });
    //     });
    //     return edges;
    // }, [quiz.questions]);

    // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    // const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Duplicate Node Function
    const duplicateNode = useCallback((nodeId: string) => {
        const questionToDuplicate = quiz.questions.find(q => q.id === nodeId);
        if (!questionToDuplicate) return;

        const newId = `q-${Date.now()}`;
        const newQuestion: Question = {
            ...questionToDuplicate,
            id: newId,
            title: `${questionToDuplicate.title} (cópia)`,
            position: {
                x: (questionToDuplicate.position?.x || 0) + 50,
                y: (questionToDuplicate.position?.y || 0) + 50
            },
            options: questionToDuplicate.options.map((opt, idx) => ({
                ...opt,
                id: `o-${Date.now()}-${idx}`,
                nextQuestionId: undefined
            }))
        };

        setQuiz(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));

        // Add new node to ReactFlow state immediately
        const newNode: Node = {
            id: newId,
            type: 'questionNode',
            position: newQuestion.position!,
            data: {
                label: newQuestion.title,
                description: newQuestion.description,
                characters: newQuestion.characters,
                avatar: quiz.avatar,
                options: newQuestion.options,
                imageUrl: newQuestion.imageUrl,
                videoUrl: newQuestion.videoUrl,
                linkUrl: newQuestion.linkUrl,
                linkText: newQuestion.linkText,
                onAddOption: () => addOptionToNode(newId),
                onEditClick: (id: string) => setActiveNodeId(id),
                onDuplicate: (id: string) => duplicateNode(id)
            }
        };

        setNodes(nds => [...nds, newNode]);
        showToast('Card duplicado com sucesso!', 'success');
    }, [quiz.questions, quiz.avatar, setNodes]);

    // Update nodes with callbacks
    useEffect(() => {
        setNodes(nds => nds.map(n => ({
            ...n,
            data: {
                ...n.data,
                onEditClick: (nodeId: string) => {
                    console.log('Edit button clicked for node:', nodeId);
                    setActiveNodeId(nodeId);
                },
                onDuplicate: (nodeId: string) => duplicateNode(nodeId)
            }
        })));
    }, [duplicateNode, setNodes]); // Update when duplicateNode changes

    // Sync ReactFlow Nodes back to Quiz State when they change (e.g., dragged)
    useEffect(() => {
        const updatedQuestions = quiz.questions.map(q => {
            const node = nodes.find(n => n.id === q.id);
            if (node) {
                return { ...q, position: node.position };
            }
            return q;
        });

        // Only update if positions actually changed to avoid loop
        const hasChanged = updatedQuestions.some((q, i) =>
            q.position?.x !== quiz.questions[i].position?.x ||
            q.position?.y !== quiz.questions[i].position?.y
        );

        if (hasChanged) {
            setQuiz({ ...quiz, questions: updatedQuestions });
        }
    }, [nodes]); // Use debounce in prod

    // Handle Connections
    const onConnect = useCallback(
        (params: Connection) => {
            // Find the source question and option
            const sourceQuestion = quiz.questions.find(q => q.id === params.source);
            if (sourceQuestion) {
                const optionIndex = sourceQuestion.options.findIndex(o => o.id === params.sourceHandle);
                if (optionIndex !== -1) {
                    const updatedQuestions = [...quiz.questions];
                    const questionIndex = updatedQuestions.findIndex(q => q.id === params.source);
                    updatedQuestions[questionIndex].options[optionIndex].nextQuestionId = params.target || undefined;
                    setQuiz({ ...quiz, questions: updatedQuestions });
                }
            }

            setEdges((eds) => addEdge({
                ...params,
                type: 'smoothstep',
                animated: true,
                style: {
                    stroke: '#22d3ee',
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 3px rgba(34,211,238,0.5))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#22d3ee',
                    width: 20,
                    height: 20
                }
            }, eds));
        },
        [quiz, setQuiz, setEdges]
    );

    const addOptionToNode = (nodeId: string) => {
        const newOption: Option = { id: `o-${Date.now()}`, text: 'Nova Opção', nextQuestionId: 'RESULT' };
        const updatedQuestions = quiz.questions.map(q =>
            q.id === nodeId ? { ...q, options: [...q.options, newOption] } : q
        );
        setQuiz({ ...quiz, questions: updatedQuestions });

        // Update node data immediately
        setNodes(nds => nds.map(n => {
            if (n.id === nodeId) {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        options: [...n.data.options, newOption]
                    }
                };
            }
            return n;
        }));
    };

    const addNode = () => {
        const newId = `q-${Date.now()}`;
        const newQuestion: Question = {
            id: newId,
            title: 'Nova Pergunta',
            description: '',
            characters: [],
            options: [{ id: `o-${Date.now()}`, text: 'Opção 1', nextQuestionId: 'RESULT' }],
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 }
        };

        setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });

        const newNode: Node = {
            id: newId,
            type: 'questionNode',
            position: newQuestion.position!,
            data: {
                label: newQuestion.title,
                description: newQuestion.description,
                avatar: quiz.avatar,
                characters: [],
                options: newQuestion.options,
                onAddOption: () => addOptionToNode(newId)
            }
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const updateActiveNode = (updates: Partial<Question>) => {
        if (!activeNodeId) return;

        const updatedQuestions = quiz.questions.map(q =>
            q.id === activeNodeId ? { ...q, ...updates } : q
        );
        setQuiz({ ...quiz, questions: updatedQuestions });

        // Update visual node
        setNodes(nds => nds.map(n =>
            n.id === activeNodeId ? {
                ...n,
                data: {
                    ...n.data,
                    label: updates.title ?? n.data.label,
                    description: updates.description ?? n.data.description,
                    characters: updates.characters ?? n.data.characters,
                    options: updates.options ?? n.data.options
                }
            } : n
        ));
    };

    const deleteActiveNode = () => {
        if (!activeNodeId) return;
        const updatedQuestions = quiz.questions.filter(q => q.id !== activeNodeId);
        setQuiz({ ...quiz, questions: updatedQuestions });
        setNodes(nds => nds.filter(n => n.id !== activeNodeId));
        setActiveNodeId(null);
    };

    const handleImageSelect = (imageUrl: string, config3D?: Character3DConfig) => {
        if (activeNodeId && activeCharIndex !== null) {
            const activeNode = quiz.questions.find(q => q.id === activeNodeId);
            if (activeNode && activeNode.characters) {
                const newChars = [...activeNode.characters];
                newChars[activeCharIndex].avatar = imageUrl;
                if (config3D) {
                    newChars[activeCharIndex].config3D = config3D;
                }
                updateActiveNode({ characters: newChars });
            }
        }
        setShowImageSelector(false);
        setShowCharacterCreator(false);
        setActiveCharIndex(null);
    };

    const generateQuizWithAI = async () => {
        if (!aiTopic) return;
        setIsGenerating(true);

        // Simulate steps
        const steps = ["Conectando...", "Analisando nicho...", "Criando copy...", "Montando fluxo..."];
        let stepIdx = 0;
        const interval = setInterval(() => {
            setLoadingStep(steps[stepIdx]);
            stepIdx = (stepIdx + 1) % steps.length;
        }, 1000);

        try {
            const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);
            const prompt = `Crie um quiz de lead generation para o nicho "${aiTopic}". Tom: ${aiTone}.
                        Retorne JSON: {"title": "...", "description": "...", "avatar": "emoji", "questions": [ {"title": "...", "description": "...", "options": ["..."] } ] }
                        Gere 4 perguntas estratégicas.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const data = JSON.parse(response.text || '{ }');

            // Transform to nodes
            const newQuestions: Question[] = data.questions.map((q: any, i: number) => ({
                id: `q-${Date.now()}-${i}`,
                title: q.title,
                description: q.description || '',
                characters: [], // AI doesn't generate complex characters yet
                position: { x: 250 + (i * 350), y: 250 },
                options: q.options.map((optText: string, oIdx: number) => ({
                    id: `o-${Date.now()}-${i}-${oIdx}`,
                    text: optText,
                    nextQuestionId: i < data.questions.length - 1 ? `q-${Date.now()}-${i + 1}` : 'RESULT'
                }))
            }));

            // Link nodes
            const newEdges: Edge[] = [];
            newQuestions.forEach((q, i) => {
                if (i < newQuestions.length - 1) {
                    const nextQ = newQuestions[i + 1];
                    q.options.forEach(opt => {
                        opt.nextQuestionId = nextQ.id; // Logic update
                        newEdges.push({
                            id: `e-${q.id}-${opt.id}`,
                            source: q.id,
                            sourceHandle: opt.id,
                            target: nextQ.id,
                            animated: true,
                            style: { stroke: '#0ea5e9' }
                        });
                    });
                }
            });

            setQuiz({
                ...quiz,
                title: data.title,
                description: data.description,
                avatar: data.avatar || '🤖',
                questions: newQuestions
            });

            // Hard reset flow
            const flowNodes = newQuestions.map(q => ({
                id: q.id,
                type: 'questionNode',
                position: q.position!,
                data: {
                    label: q.title,
                    description: q.description,
                    avatar: data.avatar,
                    characters: [],
                    options: q.options,
                    onAddOption: () => addOptionToNode(q.id)
                }
            }));

            setNodes(flowNodes);
            setEdges(newEdges);
            setShowAiModal(false);

        } catch (e) {
            console.error(e);
            alert("Erro na IA. Tente novamente.");
        } finally {
            setIsGenerating(false);
            clearInterval(interval);
        }
    };

    // Project Management State
    const [savedProjects, setSavedProjects] = useState<Quiz[]>([]);

    // Load projects on mount
    useEffect(() => {
        const saved = localStorage.getItem('quiz_projects');
        if (saved) {
            try {
                setSavedProjects(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved projects', e);
            }
        }
    }, []);

    const saveProject = () => {
        const updatedProjects = [...savedProjects];
        const existingIndex = updatedProjects.findIndex(p => p.id === quiz.id);

        if (existingIndex >= 0) {
            updatedProjects[existingIndex] = quiz;
        } else {
            updatedProjects.push(quiz);
        }

        setSavedProjects(updatedProjects);
        localStorage.setItem('quiz_projects', JSON.stringify(updatedProjects));
        alert('Projeto salvo com sucesso!');
    };

    const loadProject = (project: Quiz) => {
        if (confirm('Carregar este projeto substituirá o trabalho atual não salvo. Deseja continuar?')) {
            setQuiz(project);
            // Reset nodes to match new project
            const newNodes = project.questions.map((q, index) => ({
                id: q.id,
                type: 'questionNode',
                position: q.position || { x: 250 + (index * 350), y: 100 + (index * 50) },
                data: {
                    label: q.title,
                    description: q.description,
                    avatar: project.avatar,
                    characters: q.characters,
                    options: q.options,
                    onAddOption: () => addOptionToNode(q.id),
                    onEditClick: (nodeId: string) => setActiveNodeId(nodeId)
                }
            }));

            const newEdges: Edge[] = [];
            project.questions.forEach(q => {
                q.options.forEach(opt => {
                    if (opt.nextQuestionId && opt.nextQuestionId !== 'RESULT') {
                        newEdges.push({
                            id: `e-${q.id}-${opt.id}`,
                            source: q.id,
                            sourceHandle: opt.id,
                            target: opt.nextQuestionId,
                            animated: true,
                            style: { stroke: '#64748b' },
                            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
                        });
                    }
                });
            });

            setNodes(newNodes);
            setEdges(newEdges);
            setShowProjectsSidebar(false);
        }
    };

    const deleteProject = (projectId: string) => {
        if (confirm('Tem certeza que deseja excluir este projeto?')) {
            const updated = savedProjects.filter(p => p.id !== projectId);
            setSavedProjects(updated);
            localStorage.setItem('quiz_projects', JSON.stringify(updated));
        }
    };

    const exportTemplate = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quiz, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${quiz.title || 'quiz'}_template.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };



    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const importedQuiz = JSON.parse(content);

                // Basic validation
                if (importedQuiz.questions && Array.isArray(importedQuiz.questions)) {
                    if (confirm('Importar este template substituirá o projeto atual. Continuar?')) {
                        setQuiz(importedQuiz);

                        // Rebuild nodes
                        const newNodes = importedQuiz.questions.map((q: Question, index: number) => ({
                            id: q.id,
                            type: 'questionNode',
                            position: q.position || { x: 250 + (index * 350), y: 100 + (index * 50) },
                            data: {
                                label: q.title,
                                description: q.description,
                                avatar: importedQuiz.avatar,
                                characters: q.characters,
                                options: q.options,
                                onAddOption: () => addOptionToNode(q.id),
                                onEditClick: (nodeId: string) => setActiveNodeId(nodeId)
                            }
                        }));

                        // Rebuild edges
                        const newEdges: Edge[] = [];
                        importedQuiz.questions.forEach((q: Question) => {
                            q.options.forEach((opt: Option) => {
                                if (opt.nextQuestionId && opt.nextQuestionId !== 'RESULT') {
                                    newEdges.push({
                                        id: `e-${q.id}-${opt.id}`,
                                        source: q.id,
                                        sourceHandle: opt.id,
                                        target: opt.nextQuestionId,
                                        animated: true,
                                        style: { stroke: '#64748b' },
                                        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
                                    });
                                }
                            });
                        });

                        setNodes(newNodes);
                        setEdges(newEdges);
                        alert('Template importado com sucesso!');
                    }
                } else {
                    alert('Arquivo inválido. Certifique-se de que é um template do XQuiz.');
                }
            } catch (error) {
                console.error('Erro ao importar:', error);
                alert('Erro ao ler o arquivo.');
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    const handleCharImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || uploadingCharIndex === null || !activeNodeId) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            // Update character with base64 image
            const activeNode = quiz.questions.find(q => q.id === activeNodeId);
            if (activeNode && activeNode.characters) {
                const newChars = [...activeNode.characters];
                newChars[uploadingCharIndex].avatar = result;
                updateActiveNode({ characters: newChars });
            }
            setUploadingCharIndex(null);
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const activeNodeData = activeNodeId ? quiz.questions.find(q => q.id === activeNodeId) : null;
    console.log('Active Node ID:', activeNodeId, 'Active Node Data:', activeNodeData);

    if (showPreview) {
        return <QuizPreview quiz={quiz} onClose={() => setShowPreview(false)} />;
    }

    return (
        <div className="flex h-screen bg-[#0f1115] text-white font-sans overflow-hidden">
            <ReactFlowProvider>
                {/* Hidden Inputs */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                />
                <input
                    type="file"
                    ref={charImageInputRef}
                    onChange={handleCharImageUpload}
                    accept="image/*"
                    className="hidden"
                />

                {/* Sidebar Controls */}
                <aside className="w-16 flex flex-col items-center py-6 border-r border-slate-800 bg-[#0b0d10] z-20 gap-6">
                    <button onClick={onExit} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="w-8 h-[1px] bg-slate-800"></div>

                    <button
                        onClick={() => setShowProjectsSidebar(!showProjectsSidebar)}
                        title="Painel de Projetos"
                        className={`p-3 rounded-xl transition-all ${showProjectsSidebar ? 'bg-sky-900/50 text-sky-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Layout className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setShowSettingsSidebar(!showSettingsSidebar)}
                        title="Configurações e Integrações"
                        className={`p-3 rounded-xl transition-all ${showSettingsSidebar ? 'bg-purple-900/50 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Sliders className="w-5 h-5" />
                    </button>

                    <div className="w-8 h-[1px] bg-slate-800"></div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !user}
                        title={!user ? "Faça login para salvar" : quizId ? "Salvar alterações" : "Salvar funil"}
                        className={`p-3 rounded-xl transition-all ${isSaving ? 'bg-blue-900/50 text-blue-400' : quizId ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white' : 'text-slate-400 hover:text-white hover:bg-blue-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                    </button>

                    {/* Publish Button */}
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing || !quizId || !user}
                        title={!user ? "Faça login para publicar" : !quizId ? "Salve antes de publicar" : "Publicar funil"}
                        className={`p-3 rounded-xl transition-all ${isPublishing ? 'bg-green-900/50 text-green-400' : 'text-slate-400 hover:text-white hover:bg-green-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isPublishing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Globe className="w-5 h-5" />
                        )}
                    </button>

                    <button onClick={addNode} title="Adicionar Pergunta" className="p-3 text-sky-400 bg-sky-900/20 hover:bg-sky-500 hover:text-white rounded-xl transition-all shadow-lg shadow-sky-900/20">
                        <Plus className="w-5 h-5" />
                    </button>


                    <div className="flex-1"></div>

                    <button onClick={handleImportClick} title="Importar Template" className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                        <Upload className="w-5 h-5" />
                    </button>

                    <button onClick={exportTemplate} title="Exportar Template" className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                        <Download className="w-5 h-5" />
                    </button>

                    <button onClick={() => setShowPreview(true)} title="Testar" className="p-3 text-emerald-400 hover:text-white hover:bg-emerald-900/50 rounded-xl transition-all">
                        <Play className="w-5 h-5" />
                    </button>
                    <button onClick={saveProject} title="Salvar" className="p-3 text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-lg shadow-sky-900/40 mb-2">
                        <Save className="w-5 h-5" />
                    </button>
                </aside>

                {/* Projects Sidebar (Left Drawer) */}
                {showProjectsSidebar && (
                    <aside className="w-96 bg-[#0c0d10] border-r border-slate-800 p-6 flex flex-col h-full z-20 animate-in slide-in-from-left duration-300 absolute left-16 top-0 bottom-0 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Layout className="w-4 h-4" /> Gerenciar Projetos
                            </h3>
                            <button onClick={() => setShowProjectsSidebar(false)} className="text-slate-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                            {savedProjects.length === 0 ? (
                                <div className="text-center p-8 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
                                    Nenhum projeto salvo.
                                </div>
                            ) : (
                                savedProjects.map(p => (
                                    <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-sky-500/50 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-200 text-sm line-clamp-1">{p.title}</h4>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                                                className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-3 h-8">{p.description || 'Sem descrição'}</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => loadProject(p)}
                                                className="flex-1 py-1.5 bg-sky-900/30 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg text-xs font-medium transition-all"
                                            >
                                                Abrir
                                            </button>
                                            <div className="text-[10px] text-slate-600 flex items-center">
                                                {p.questions.length} passos
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                                <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Link Público</h4>
                                <p className="text-[10px] text-slate-500 mb-3">Para compartilhar seu quiz, você precisa publicar o projeto.</p>
                                <button
                                    onClick={handlePublish}
                                    disabled={isPublishing}
                                    className="w-full py-2 bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 rounded-lg text-xs font-bold hover:bg-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPublishing ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Publicando...
                                        </>
                                    ) : (
                                        <>
                                            <Globe className="w-3 h-3" />
                                            Gerar Link
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </aside>
                )}

                {/* Settings Sidebar (Left Drawer) */}
                {showSettingsSidebar && (
                    <aside className="w-96 bg-[#0c0d10] border-r border-slate-800 p-6 flex flex-col h-full z-20 animate-in slide-in-from-left duration-300 absolute left-16 top-0 bottom-0 shadow-2xl overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <Sliders className="w-5 h-5" /> Configurações & Integrações
                            </h3>
                            <button onClick={() => setShowSettingsSidebar(false)} className="text-slate-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Custom Domain */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Globe className="w-5 h-5 text-sky-400" />
                                    <h4 className="text-sm font-bold text-white">Domínio Personalizado</h4>
                                </div>
                                <p className="text-xs text-slate-400 mb-4">Configure seu domínio personalizado para o quiz</p>
                                <input
                                    type="text"
                                    value={quiz.settings?.customDomain || ''}
                                    onChange={(e) => setQuiz({ ...quiz, settings: { ...quiz.settings, customDomain: e.target.value } })}
                                    placeholder="exemplo: quiz.seudominio.com"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none transition-colors"
                                />
                                <p className="text-xs text-slate-500 mt-2">💡 Configure o DNS apontando para o Vercel</p>
                            </div>

                            {/* Webhooks */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Zap className="w-5 h-5 text-emerald-400" />
                                    <h4 className="text-sm font-bold text-white">Integrações & Webhooks</h4>
                                </div>
                                <p className="text-xs text-slate-400 mb-4">Envie os dados do quiz para sua aplicação</p>
                                <input
                                    type="url"
                                    value={quiz.settings?.webhookUrl || ''}
                                    onChange={(e) => setQuiz({ ...quiz, settings: { ...quiz.settings, webhookUrl: e.target.value } })}
                                    placeholder="https://sua-api.com/webhook"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                                />
                                <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <p className="text-xs text-slate-400 mb-2">📦 Dados enviados:</p>
                                    <code className="text-xs text-emerald-400 font-mono">
                                        {`{ answers: [], timestamp, userId }`}
                                    </code>
                                </div>
                            </div>

                            {/* Facebook Pixel */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    <h4 className="text-sm font-bold text-white">Facebook Pixel</h4>
                                </div>
                                <p className="text-xs text-slate-400 mb-4">Rastreie conversões e otimize anúncios</p>
                                <input
                                    type="text"
                                    value={quiz.settings?.facebookPixel || ''}
                                    onChange={(e) => setQuiz({ ...quiz, settings: { ...quiz.settings, facebookPixel: e.target.value } })}
                                    placeholder="Seu Pixel ID (ex: 123456789012345)"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                                />
                                <p className="text-xs text-slate-500 mt-2">📊 Eventos rastreados: PageView, Lead, CompleteRegistration</p>
                            </div>

                            {/* Google Pixel / Analytics */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                                    </svg>
                                    <h4 className="text-sm font-bold text-white">Google Analytics / Tag</h4>
                                </div>
                                <p className="text-xs text-slate-400 mb-4">Monitore o desempenho do seu quiz</p>
                                <input
                                    type="text"
                                    value={quiz.settings?.googlePixel || ''}
                                    onChange={(e) => setQuiz({ ...quiz, settings: { ...quiz.settings, googlePixel: e.target.value } })}
                                    placeholder="G-XXXXXXXXXX ou GTM-XXXXXX"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none transition-colors"
                                />
                                <p className="text-xs text-slate-500 mt-2">📈 Suporta GA4 e Google Tag Manager</p>
                            </div>

                            {/* Result Page Settings */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-5 h-5 text-purple-400" />
                                    <h4 className="text-sm font-bold text-white">Página de Resultado</h4>
                                </div>
                                <p className="text-xs text-slate-400 mb-4">Personalize a tela final do seu quiz</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Título</label>
                                        <input
                                            type="text"
                                            value={quiz.resultPage?.title || ''}
                                            onChange={(e) => setQuiz({
                                                ...quiz,
                                                resultPage: {
                                                    ...quiz.resultPage,
                                                    title: e.target.value,
                                                    description: quiz.resultPage?.description || '',
                                                    mediaType: quiz.resultPage?.mediaType || 'video',
                                                    ctaText: quiz.resultPage?.ctaText || 'QUERO MEU PLANO',
                                                    ctaUrl: quiz.resultPage?.ctaUrl || '',
                                                    ctaStyle: quiz.resultPage?.ctaStyle || 'success',
                                                    socialLinks: quiz.resultPage?.socialLinks || []
                                                }
                                            })}
                                            placeholder="Ex: ATENÇÃO: Sua Análise Está Pronta!"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Descrição</label>
                                        <textarea
                                            value={quiz.resultPage?.description || ''}
                                            onChange={(e) => setQuiz({
                                                ...quiz,
                                                resultPage: { ...quiz.resultPage!, description: e.target.value }
                                            })}
                                            placeholder="Ex: Assista ao vídeo curto abaixo..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none resize-none h-20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">URL do Vídeo (VSL)</label>
                                        <input
                                            type="url"
                                            value={quiz.resultPage?.mediaUrl || ''}
                                            onChange={(e) => setQuiz({
                                                ...quiz,
                                                resultPage: { ...quiz.resultPage!, mediaUrl: e.target.value, mediaType: 'video' }
                                            })}
                                            placeholder="https://..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Texto do Botão</label>
                                            <input
                                                type="text"
                                                value={quiz.resultPage?.ctaText || ''}
                                                onChange={(e) => setQuiz({
                                                    ...quiz,
                                                    resultPage: { ...quiz.resultPage!, ctaText: e.target.value }
                                                })}
                                                placeholder="QUERO MEU PLANO"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Link do Botão</label>
                                            <input
                                                type="url"
                                                value={quiz.resultPage?.ctaUrl || ''}
                                                onChange={(e) => setQuiz({
                                                    ...quiz,
                                                    resultPage: { ...quiz.resultPage!, ctaUrl: e.target.value }
                                                })}
                                                placeholder="https://..."
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={() => {
                                    saveProject();
                                    alert('Configurações salvas com sucesso!');
                                }}
                                className="w-full py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold rounded-lg transition-all shadow-lg text-sm"
                            >
                                💾 Salvar Configurações
                            </button>
                        </div>
                    </aside>
                )}

                {/* Canvas */}
                <main className="flex-1 relative h-full">
                    <div className="absolute top-6 left-6 z-10 bg-slate-900/80 backdrop-blur border border-slate-800 px-4 py-2 rounded-full flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <input
                            value={quiz.title}
                            onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                            className="bg-transparent border-none outline-none text-sm font-semibold text-slate-200 w-48"
                        />
                    </div>

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        onNodeClick={(_, node) => {
                            console.log('Node clicked:', node.id);
                            setActiveNodeId(node.id);
                        }}
                        onPaneClick={() => setActiveNodeId(null)}
                        nodesDraggable={true}
                        elementsSelectable={true}
                        selectionOnDrag={false} // Disable blue selection box on drag
                        panOnDrag={true} // Enable panning on drag
                        fitView
                        minZoom={0.5}
                        maxZoom={1.5}
                        defaultEdgeOptions={{
                            type: 'smoothstep',
                            animated: true,
                            style: {
                                stroke: '#22d3ee', // Cyan-400
                                strokeWidth: 4,
                                filter: 'drop-shadow(0 0 3px rgba(34,211,238,0.5))'
                            },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#22d3ee',
                                width: 20,
                                height: 20
                            }
                        }}
                        className="bg-[#0f1115]"
                    >
                        <Background color="#1e293b" gap={20} size={1} variant={BackgroundVariant.Dots} />
                        <Controls className="bg-slate-800 border-slate-700 fill-slate-400" />
                        <MiniMap
                            nodeStrokeColor="#0ea5e9"
                            nodeColor="#1e293b"
                            maskColor="rgba(0,0,0, 0.6)"
                            className="bg-slate-900 border border-slate-800 rounded-lg !bottom-6 !right-6"
                        />
                    </ReactFlow>
                </main>

                {/* Properties Panel (Right Sidebar) */}
                {activeNodeData && (
                    <aside className="w-80 bg-[#0c0d10] border-l border-slate-800 p-6 flex flex-col h-full z-20 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Propriedades
                            </h3>
                            <button onClick={() => setActiveNodeId(null)} className="text-slate-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">

                            {/* Character Management */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
                                        <Users className="w-3 h-3" /> Personagens
                                    </label>
                                    <button
                                        onClick={() => {
                                            const newChar: QuizCharacter = {
                                                id: `char-${Date.now()}`,
                                                name: 'Novo',
                                                avatar: '🤖',
                                                speech: 'Olá!'
                                            };
                                            const currentChars = activeNodeData.characters || [];
                                            updateActiveNode({ characters: [...currentChars, newChar] });
                                        }}
                                        className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Adicionar
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {activeNodeData.characters?.map((char, idx) => (
                                        <div key={char.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                                            <div className="flex gap-2">
                                                <div className="relative group/avatar">
                                                    <button
                                                        onClick={() => {
                                                            setActiveCharIndex(idx);
                                                            setShowCharacterLibrary(true);
                                                        }}
                                                        className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center hover:border-sky-500 transition-colors shrink-0"
                                                        title="Biblioteca de Personagens"
                                                    >
                                                        {char.avatar.startsWith('http') || char.avatar.startsWith('/') || char.avatar.startsWith('data:') ? (
                                                            <img src={char.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xl">{char.avatar}</span>
                                                        )}
                                                    </button>
                                                    {/* Quick Upload Button Overlay */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setUploadingCharIndex(idx);
                                                            charImageInputRef.current?.click();
                                                        }}
                                                        className="absolute -bottom-1 -right-1 bg-slate-700 text-white p-1 rounded-full border border-slate-600 hover:bg-sky-500 transition-colors shadow-sm"
                                                        title="Upload Rápido"
                                                    >
                                                        <Upload className="w-2 h-2" />
                                                    </button>
                                                </div>

                                                <input
                                                    value={char.name}
                                                    onChange={(e) => {
                                                        const newChars = [...(activeNodeData.characters || [])];
                                                        newChars[idx].name = e.target.value;
                                                        updateActiveNode({ characters: newChars });
                                                    }}
                                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 text-xs text-white focus:border-sky-500 outline-none"
                                                    placeholder="Nome do personagem"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newChars = (activeNodeData.characters || []).filter((_, i) => i !== idx);
                                                        updateActiveNode({ characters: newChars });
                                                    }}
                                                    className="text-slate-600 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <textarea
                                                value={char.speech}
                                                onChange={(e) => {
                                                    const newChars = [...(activeNodeData.characters || [])];
                                                    newChars[idx].speech = e.target.value;
                                                    updateActiveNode({ characters: newChars });
                                                }}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 resize-none h-32 focus:border-sky-500 outline-none"
                                                placeholder="O que este personagem diz?"
                                            />
                                        </div>
                                    ))}
                                    {(!activeNodeData.characters || activeNodeData.characters.length === 0) && (
                                        <div className="text-center p-4 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                                            Nenhum personagem adicionado. Adicione um para criar um diálogo antes da pergunta.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-slate-800" />

                            {/* Media & Links */}
                            <div className="space-y-4">
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Mídia & Links</label>

                                {/* Image Input */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <Image className="w-3 h-3" /> Imagem do Card
                                    </label>
                                    <input
                                        type="url"
                                        value={activeNodeData.imageUrl || ''}
                                        onChange={(e) => updateActiveNode({ imageUrl: e.target.value })}
                                        placeholder="URL da imagem (https://...)"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                                    />
                                </div>

                                {/* Video Input */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <Video className="w-3 h-3" /> Vídeo (YouTube/Vimeo)
                                    </label>
                                    <input
                                        type="url"
                                        value={activeNodeData.videoUrl || ''}
                                        onChange={(e) => updateActiveNode({ videoUrl: e.target.value })}
                                        placeholder="URL do vídeo"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                                    />
                                </div>

                                {/* Link/CTA Input */}
                                <div className="space-y-2 p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <Link className="w-3 h-3" /> Botão de Link (CTA)
                                    </label>
                                    <input
                                        type="url"
                                        value={activeNodeData.linkUrl || ''}
                                        onChange={(e) => updateActiveNode({ linkUrl: e.target.value })}
                                        placeholder="URL de destino"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={activeNodeData.linkText || ''}
                                        onChange={(e) => updateActiveNode({ linkText: e.target.value })}
                                        placeholder="Texto do botão (ex: Saiba Mais)"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-800" />
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase">Opções</label>
                                <div className="space-y-2">
                                    {activeNodeData.options.map((opt, idx) => (
                                        <div key={opt.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
                                            <div className="flex gap-2">
                                                <div className="flex items-center justify-center w-8 bg-slate-800 rounded-lg text-xs font-bold text-slate-500 h-9">
                                                    {String.fromCharCode(65 + idx)}
                                                </div>
                                                <input
                                                    value={opt.text}
                                                    onChange={(e) => {
                                                        const newOptions = [...activeNodeData.options];
                                                        newOptions[idx].text = e.target.value;
                                                        updateActiveNode({ options: newOptions });
                                                    }}
                                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
                                                    placeholder="Texto da opção"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={opt.clickPercentage || ''}
                                                    onChange={(e) => {
                                                        const newOptions = [...activeNodeData.options];
                                                        newOptions[idx].clickPercentage = parseInt(e.target.value) || 0;
                                                        updateActiveNode({ options: newOptions });
                                                    }}
                                                    className="w-14 bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-300 focus:border-sky-500 focus:outline-none text-center"
                                                    placeholder="%"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newOptions = activeNodeData.options.filter((_, i) => i !== idx);
                                                        updateActiveNode({ options: newOptions });
                                                    }}
                                                    className="p-2 text-slate-600 hover:text-red-500 hover:bg-slate-800 rounded-lg transition-colors h-9 w-9 flex items-center justify-center"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Image Input for Option */}
                                            <input
                                                value={opt.image || ''}
                                                onChange={(e) => {
                                                    const newOptions = [...activeNodeData.options];
                                                    newOptions[idx].image = e.target.value;
                                                    updateActiveNode({ options: newOptions });
                                                }}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
                                                placeholder="URL da imagem (opcional - PNG/JPG)"
                                            />
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const newOptions = [...activeNodeData.options, { id: `o-${Date.now()}`, text: 'Nova Opção', nextQuestionId: 'RESULT' }];
                                            updateActiveNode({ options: newOptions });
                                        }}
                                        className="w-full py-2 bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-slate-400 text-xs font-medium rounded-lg transition-all mt-2"
                                    >
                                        + Adicionar
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <button
                                    onClick={deleteActiveNode}
                                    className="w-full py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Excluir Passo
                                </button>
                            </div>
                        </div>
                    </aside >
                )}
            </ReactFlowProvider >

            {/* AI Modal */}
            {
                showAiModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 relative shadow-2xl">
                            <button onClick={() => !isGenerating && setShowAiModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white"><Sparkles className="w-6 h-6" /></div>
                                <h2 className="text-xl font-bold">Gerador Automático</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nicho</label>
                                    <input
                                        value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white mt-2 focus:border-purple-500 outline-none"
                                        placeholder="Ex: Emagrecimento"
                                    />
                                </div>
                                <button
                                    onClick={generateQuizWithAI}
                                    disabled={!aiTopic || isGenerating}
                                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl text-white font-bold mt-4 flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? <><Loader2 className="animate-spin w-4 h-4" /> {loadingStep}</> : 'Gerar Funil'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Image Selector Modal */}
            {
                showImageSelector && (
                    <ImageSelector
                        onSelect={handleImageSelect}
                        onClose={() => {
                            setShowImageSelector(false);
                            setActiveCharIndex(null);
                        }}
                    />
                )
            }

            {/* Character Creator Modal */}
            {
                showCharacterCreator && (
                    <QuickCharacterSelector
                        onSelect={handleImageSelect}
                        onClose={() => {
                            setShowCharacterCreator(false);
                            setActiveCharIndex(null);
                        }}
                    />
                )
            }

            {/* Character Library Modal */}
            {
                showCharacterLibrary && (
                    <CharacterLibrary
                        onSelect={(imageUrl) => {
                            if (activeNodeId && activeCharIndex !== null) {
                                const activeNode = quiz.questions.find(q => q.id === activeNodeId);
                                if (activeNode && activeNode.characters) {
                                    const newChars = [...activeNode.characters];
                                    newChars[activeCharIndex].avatar = imageUrl;
                                    updateActiveNode({ characters: newChars });
                                }
                            }
                            setShowCharacterLibrary(false);
                            setActiveCharIndex(null);
                        }}
                        onClose={() => {
                            setShowCharacterLibrary(false);
                            setActiveCharIndex(null);
                        }}
                    />
                )
            }
        </div >
    );
};

export default QuizBuilder;
