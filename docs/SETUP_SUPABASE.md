# 🚀 Guia de Setup do Supabase - XQuiz

## Pré-requisitos

- Conta no Supabase (https://supabase.com)
- Node.js instalado
- Projeto XQuiz clonado localmente

---

## Passo 1: Criar Projeto no Supabase

1. Acesse https://app.supabase.com
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `xquiz-production` (ou outro nome)
   - **Database Password**: Crie uma senha forte e **SALVE**
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos para o projeto ser criado

---

## Passo 2: Obter Credenciais

1. No dashboard do projeto, vá em **Settings** → **API**
2. Copie as seguintes informações:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (chave pública)
   - **service_role** key (chave privada - **NUNCA exponha no frontend!**)

---

## Passo 3: Configurar Variáveis de Ambiente

1. No seu projeto local, abra o arquivo `.env.local`
2. Adicione/atualize as seguintes variáveis:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Service Role (apenas para backend/webhooks)
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

> ⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env.local` no Git!

---

## Passo 4: Executar Migrations

### Opção A: Via Dashboard do Supabase (Recomendado para iniciantes)

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em **"New query"**
3. Copie e cole o conteúdo de cada arquivo SQL na ordem:
   - `01_profiles.sql`
   - `02_subscriptions.sql`
   - `03_quizzes.sql`
   - `04_published_quizzes.sql`
   - `05_quiz_analytics.sql`
   - `06_templates.sql`
4. Execute cada query clicando em **"Run"**
5. Verifique se não há erros

### Opção B: Via Supabase CLI (Avançado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-ref

# Executar migrations
supabase db push
```

---

## Passo 5: Verificar Tabelas Criadas

1. No dashboard, vá em **Table Editor**
2. Você deve ver 6 tabelas:
   - ✅ `profiles`
   - ✅ `subscriptions`
   - ✅ `quizzes`
   - ✅ `published_quizzes`
   - ✅ `quiz_analytics`
   - ✅ `templates`

3. Clique em `templates` e verifique que há 2 templates pré-carregados

---

## Passo 6: Configurar Autenticação

1. No dashboard, vá em **Authentication** → **Providers**
2. Habilite os providers que deseja:
   - ✅ **Email** (recomendado)
   - Google (opcional)
   - Facebook (opcional)
3. Configure as URLs de redirecionamento:
   - **Site URL**: `http://localhost:5173` (desenvolvimento)
   - **Redirect URLs**: `http://localhost:5173/**`

---

## Passo 7: Testar Conexão

1. No seu projeto, rode:

```bash
npm run dev
```

2. Abra o console do navegador (F12)
3. Execute:

```javascript
import { supabase } from './services/supabase';
const { data, error } = await supabase.from('templates').select('*');
console.log('Templates:', data);
```

4. Você deve ver os 2 templates retornados

---

## Passo 8: Configurar Webhooks da Kiwify (Futuro)

> 📝 **Nota**: Isso será configurado depois quando você tiver o domínio em produção

1. Criar endpoint `/api/webhooks/kiwify` no seu backend
2. Configurar URL no painel da Kiwify
3. Processar eventos de pagamento e atualizar tabela `subscriptions`

---

## 🔒 Segurança - Row Level Security (RLS)

Todas as tabelas já estão configuradas com RLS. Isso significa:

- ✅ Usuários só veem seus próprios dados
- ✅ Funis publicados são acessíveis publicamente
- ✅ Templates premium só aparecem para planos adequados
- ✅ Analytics só são visíveis para donos dos quizzes

**Nunca desabilite o RLS em produção!**

---

## 📊 Estrutura de Dados

### Profiles
- Criado automaticamente quando usuário se registra
- Sincronizado com `auth.users`

### Subscriptions
- Trial de 7 dias criado automaticamente
- Limites definidos automaticamente pelo plano
- Atualizado via webhook da Kiwify

### Quizzes
- Soft delete (não apaga, apenas marca como deletado)
- Limite verificado automaticamente ao criar
- JSONB para flexibilidade total

### Published Quizzes
- Slug único gerado automaticamente
- Sincroniza status com quiz
- Acesso público via RLS

### Quiz Analytics
- Agregação diária automática
- Funções para rastrear views/starts/completions
- Cálculo automático de taxas de conversão

### Templates
- 2 templates gratuitos pré-carregados
- Acesso baseado em plano
- Rastreamento de uso

---

## 🧪 Testes Recomendados

### 1. Criar Usuário de Teste

```sql
-- No SQL Editor do Supabase
SELECT auth.signup('teste@exemplo.com', 'senha123');
```

Verifique que:
- Perfil foi criado em `profiles`
- Assinatura trial foi criada em `subscriptions`

### 2. Criar Quiz de Teste

```javascript
const { data, error } = await supabase
  .from('quizzes')
  .insert({
    title: 'Meu Primeiro Quiz',
    quiz_data: { questions: [] }
  })
  .select();
```

### 3. Publicar Quiz

```javascript
const { data, error } = await supabase
  .from('published_quizzes')
  .insert({
    quiz_id: 'id-do-quiz',
    slug: 'meu-quiz-teste'
  })
  .select();
```

### 4. Rastrear View

```javascript
await supabase.rpc('increment_quiz_view', {
  p_quiz_id: 'id-do-quiz',
  p_device_type: 'desktop'
});
```

---

## 🐛 Troubleshooting

### Erro: "relation does not exist"
- Verifique se todas as migrations foram executadas na ordem correta
- Rode novamente a migration que falhou

### Erro: "permission denied for table"
- Verifique se RLS está configurado corretamente
- Certifique-se de estar autenticado

### Erro: "Quiz limit reached"
- Isso é esperado! O sistema está funcionando
- Verifique sua assinatura em `subscriptions`
- Atualize o plano ou delete quizzes antigos

### Templates não aparecem
- Verifique se a migration `06_templates.sql` foi executada
- Rode manualmente os INSERTs de templates

---

## 📚 Próximos Passos

Após configurar o banco de dados:

1. ✅ Implementar autenticação no frontend
2. ✅ Criar serviços de banco de dados
3. ✅ Atualizar componentes para usar Supabase
4. ✅ Configurar webhook da Kiwify
5. ✅ Testar fluxo completo

---

## 🆘 Suporte

Se tiver problemas:
1. Verifique os logs no Supabase Dashboard → **Logs**
2. Teste queries no SQL Editor
3. Revise as políticas RLS em **Authentication** → **Policies**

**Boa sorte! 🚀**
