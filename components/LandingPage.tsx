import React, { useState } from 'react';
import {
  Menu, Globe, User, Sparkles, ArrowDownCircle,
  Flame, Zap, Target, Users, Check, Mail, Instagram, Youtube, Play, X
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onCtaClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onCtaClick }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleBilling = () => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly');

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-950 font-sans text-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-40 flex justify-center py-6">
        <nav className="flex w-full max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-8 lg:flex-1">
            <a href="#" className="flex items-center gap-2 -m-1.5 p-1.5 font-bold text-2xl tracking-tighter">
              <span className="text-sky-500">X</span>Quiz
            </a>
            <div className="hidden lg:flex lg:gap-8">
              <a href="#" className="text-sm font-semibold leading-6 text-white hover:text-sky-300 transition-colors">Início</a>
              <a href="#features" className="text-sm font-semibold leading-6 text-white hover:text-sky-300 transition-colors">Funcionalidades</a>
              <a href="#pricing" className="text-sm font-semibold leading-6 text-white hover:text-sky-300 transition-colors">Planos</a>
              <a href="#" className="text-sm font-semibold leading-6 text-white hover:text-sky-300 transition-colors">Contato</a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden lg:flex items-center gap-2 text-sm font-semibold text-white border border-slate-700 rounded-lg px-4 py-2 hover:bg-slate-900 transition-colors">
              <Globe className="w-4 h-4" />
              Português
            </button>
            <button
              onClick={onLogin}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-b from-sky-600 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-sky-500 hover:to-sky-400 border border-transparent"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Fazer Login</span>
              <span className="sm:hidden">Entrar</span>
            </button>
            <button
              className="lg:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-slate-950 pt-24 px-6 lg:hidden">
          <div className="flex flex-col gap-6 text-lg font-semibold">
            <a href="#" onClick={() => setMobileMenuOpen(false)}>Início</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Funcionalidades</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Planos</a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative isolate pt-32 pb-20 sm:pt-48 sm:pb-32">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl opacity-30">
          <div className="aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-sky-500 to-indigo-500 opacity-30" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="max-w-2xl text-center md:text-left md:w-1/2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl text-balance">
              Conheça o poder do <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Funil Interativo</span>.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300 text-balance">
              Crie uma experiência única para os seus clientes e observe o seu custo por lead cair drasticamente.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <button
                onClick={onCtaClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-sky-600 to-sky-500 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:from-sky-500 hover:to-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                <Sparkles className="w-4 h-4" />
                Testar Demo Grátis
              </button>
              <a href="#pricing" className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold leading-6 text-white border border-slate-700 px-6 py-3.5 rounded-lg hover:bg-slate-900 transition-colors">
                <ArrowDownCircle className="w-4 h-4" />
                Veja os planos
              </a>
            </div>

            {/* Integrations */}
            <div className="mt-10 border-t border-white/10 pt-8">
              <p className="text-sm font-semibold text-slate-400 mb-4">Integrado com:</p>
              <div className="flex flex-wrap gap-6 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <span className="font-bold text-xl">Hotmart</span>
                <span className="font-bold text-xl">Kiwify</span>
                <span className="font-bold text-xl">Eduzz</span>
                <span className="font-bold text-xl">ActiveCampaign</span>
              </div>
            </div>
          </div>

          {/* Hero Image / Collage */}
          <div className="mt-16 md:mt-0 md:w-1/2 flex justify-center relative">
            <div className="relative w-full max-w-[500px] grid grid-cols-2 gap-4 p-4">
              {/* Character 1 */}
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group transform hover:-translate-y-2 transition-all duration-500">
                <img src="/characters/collage_1.png" alt="Personagem 3D" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60"></div>
              </div>

              {/* Character 2 - Offset down slightly for dynamic look */}
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group transform translate-y-8 hover:translate-y-6 transition-all duration-500">
                <img src="/characters/collage_2.png" alt="Personagem 3D" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60"></div>
              </div>

              {/* Character 3 */}
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group transform -translate-y-8 hover:-translate-y-10 transition-all duration-500">
                <img src="/characters/collage_3.png" alt="Personagem 3D" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60"></div>
              </div>

              {/* Character 4 */}
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group transform hover:-translate-y-2 transition-all duration-500">
                <img src="/characters/collage_4.png" alt="Personagem 3D" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-60"></div>
              </div>
            </div>

            {/* Glow behind collage */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-sky-500/20 blur-3xl -z-10 rounded-full pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32 bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-sky-400">Simples, prático e intuitivo</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Construa o seu funil com um Flow 100% arrasta e solta.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3 text-left">
              {[
                {
                  name: 'Uma experiência única',
                  description: 'Proporcione uma experiência totalmente única para o seu cliente, antes de qualquer outro concorrente.',
                  icon: Sparkles,
                },
                {
                  name: 'Muito mais velocidade',
                  description: 'O XQuiz é totalmente otimizado para poupar o seu tempo e te ajudar a testar muito mais rápido.',
                  icon: Flame,
                },
                {
                  name: 'Variáveis dinâmicas',
                  description: 'É possível capturar dados do seu cliente, e a partir disso definir as próximas páginas do seu funil.',
                  icon: Zap,
                },
                {
                  name: 'Integrações',
                  description: 'É possível integrar o XQuiz com várias ferramentas que você já utiliza.',
                  icon: Target,
                },
                {
                  name: 'Tudo em um só lugar',
                  description: 'Com o XQuiz, você não precisa mais de hospedagem ou qualquer outro serviço.',
                  icon: Users,
                },
                {
                  name: 'Elementos Interativos',
                  description: 'São mais 25 elementos interativos que você pode utilizar para criar o seu funil.',
                  icon: Play,
                },
              ].map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <feature.icon className="h-5 w-5 flex-none text-sky-400" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 sm:py-32 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-sky-400">Pronto para começar?</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Planos para todos os negócios.
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Comece a criar experiências incríveis para os seus clientes ainda hoje.
            </p>

            {/* Toggle */}
            <div className="mt-10 flex justify-center">
              <div className="relative flex bg-slate-900 rounded-full p-1 border border-slate-800">
                <button
                  onClick={toggleBilling}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${billingCycle === 'monthly' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Mensal
                </button>
                <button
                  onClick={toggleBilling}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${billingCycle === 'yearly' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Anual
                </button>
              </div>
            </div>
          </div>

          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
            {/* Basic Tier */}
            <div className="rounded-3xl p-8 ring-1 ring-white/10 bg-white/5 xl:p-10">
              <h3 className="text-lg font-semibold leading-8 text-white">Basic</h3>
              <p className="mt-4 text-sm leading-6 text-slate-300">Ideal para quem está começando.</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-white">{billingCycle === 'monthly' ? 'R$ 97' : 'R$ 57'}</span>
                <span className="text-sm font-semibold leading-6 text-slate-400">/mês</span>
              </p>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
                {['Até 3 funis', 'Até 10.000 acessos', 'Elementos interativos', 'Domínio personalizado'].map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-sky-400" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={onCtaClick} className="mt-8 block w-full rounded-md border border-slate-700 bg-transparent px-3 py-2 text-center text-sm font-semibold leading-6 text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                Comece agora
              </button>
            </div>

            {/* Pro Tier (Highlighted) */}
            <div className="rounded-3xl p-8 ring-2 ring-sky-500 bg-slate-900/50 xl:p-10 relative">
              <div className="absolute top-0 right-0 -mt-4 mr-4 bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                Mais Vendido
              </div>
              <h3 className="text-lg font-semibold leading-8 text-white">Pro</h3>
              <p className="mt-4 text-sm leading-6 text-slate-300">Perfeito para os profissionais.</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-white">{billingCycle === 'monthly' ? 'R$ 197' : 'R$ 147'}</span>
                <span className="text-sm font-semibold leading-6 text-slate-400">/mês</span>
              </p>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
                {['Até 10 funis', 'Até 50.000 acessos', 'Elementos interativos', 'Domínio personalizado', 'Integrações e Webhooks'].map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-sky-400" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={onCtaClick} className="mt-8 block w-full rounded-md bg-sky-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                Comece agora
              </button>
            </div>

            {/* Black Tier */}
            <div className="rounded-3xl p-8 ring-1 ring-white/10 bg-black/40 xl:p-10">
              <h3 className="text-lg font-semibold leading-8 text-white">Black</h3>
              <p className="mt-4 text-sm leading-6 text-slate-300">Ideal para quem joga em alto nível.</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-white">{billingCycle === 'monthly' ? 'R$ 497' : 'R$ 297'}</span>
                <span className="text-sm font-semibold leading-6 text-slate-400">/mês</span>
              </p>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
                {['Até 25 funis', 'Até 100.000 acessos', 'Todos recursos Pro', 'Prioridade no suporte', 'Consultoria de implementação'].map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-sky-400" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={onCtaClick} className="mt-8 block w-full rounded-md border border-slate-700 bg-transparent px-3 py-2 text-center text-sm font-semibold leading-6 text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                Comece agora
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 px-6 py-12 lg:px-8 border-t border-slate-900">
        <div className="flex justify-center gap-x-8">
          <a href="#" className="text-slate-400 hover:text-white"><Mail className="w-6 h-6" /></a>
          <a href="#" className="text-slate-400 hover:text-white"><Instagram className="w-6 h-6" /></a>
          <a href="#" className="text-slate-400 hover:text-white"><Youtube className="w-6 h-6" /></a>
        </div>
        <p className="mt-8 text-center text-xs leading-5 text-slate-500">
          &copy; 2025 XQuiz. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;