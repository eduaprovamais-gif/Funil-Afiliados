# 🚀 Guia Rápido: Executar Migrations no Supabase

## 📋 Passo a Passo

### 1️⃣ Acessar o Projeto Supabase

Você já tem o projeto criado: **"Projeto de eduaprovamais@gmail.com"**

1. Acesse: https://app.supabase.com
2. Clique no seu projeto
3. No menu lateral, clique em **"SQL Editor"**

![Projeto Supabase](file:///C:/Users/ear/.gemini/antigravity/brain/7b88d689-e4d2-43a1-84b8-b14ed9d042f8/uploaded_image_1764869654863.png)

---

### 2️⃣ Executar as Migrations

Você precisa executar **6 arquivos SQL na ordem correta**. Para cada um:

1. Clique em **"New query"** no SQL Editor
2. Copie todo o conteúdo do arquivo SQL
3. Cole no editor
4. Clique em **"Run"** (ou pressione Ctrl+Enter)
5. Verifique que não há erros (deve aparecer "Success")

#### Ordem de Execução:

##### ✅ Migration 1: Profiles
**Arquivo:** [01_profiles.sql](file:///c:/Users/ear/OneDrive/Documentos/FUNIL%20AFILIADOS/supabase/migrations/01_profiles.sql)

```sql
-- Copie e cole TODO o conteúdo deste arquivo
-- Cria tabela de perfis de usuários
```

##### ✅ Migration 2: Subscriptions
**Arquivo:** [02_subscriptions.sql](file:///c:/Users/ear/OneDrive/Documentos/FUNIL%20AFILIADOS/supabase/migrations/02_subscriptions.sql)

```sql
-- Copie e cole TODO o conteúdo deste arquivo
-- Cria tabela de assinaturas e planos
```

##### ✅ Migration 3: Quizzes
**Arquivo:** [03_quizzes.sql](file:///c:/Users/ear/OneDrive/Documentos/FUNIL%20AFILIADOS/supabase/migrations/03_quizzes.sql)

```sql
-- Copie e cole TODO o conteúdo deste arquivo
-- Cria tabela de funis
```

##### ✅ Migration 4: Published Quizzes
**Arquivo:** [04_published_quizzes.sql](file:///c:/Users/ear/OneDrive/Documentos/FUNIL%20AFILIADOS/supabase/migrations/04_published_quizzes.sql)

```sql
-- Copie e cole TODO o conteúdo deste arquivo
-- Cria tabela de funis publicados
```

##### ✅ Migration 5: Quiz Analytics
**Arquivo:** [05_quiz_analytics.sql](file:///c:/Users/ear/OneDrive/Documentos/FUNIL%20AFILIADOS/supabase/migrations/05_quiz_analytics.sql)

```sql
-- Copie e cole TODO o conteúdo deste arquivo
-- Cria tabela de analytics
```

##### ✅ Migration 6: Templates
**Arquivo:** [06_templates.sql](file:///c:/Users/ear/OneDrive/Documentos/FUNIL%20AFILIADOS/supabase/migrations/06_templates.sql)

```sql
-- Copie e cole TODO o conteúdo deste arquivo
-- Cria tabela de templates e insere 2 templates gratuitos
```

---

### 3️⃣ Verificar se Deu Certo

Após executar todas as migrations:

1. No menu lateral, clique em **"Table Editor"**
2. Você deve ver **6 tabelas**:
   - ✅ profiles
   - ✅ subscriptions
   - ✅ quizzes
   - ✅ published_quizzes
   - ✅ quiz_analytics
   - ✅ templates

3. Clique na tabela **templates**
4. Você deve ver **2 registros** (os templates gratuitos)

---

### 4️⃣ Verificar Variáveis de Ambiente

Verifique se o arquivo `.env.local` tem as credenciais corretas:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

Para obter as credenciais:
1. No Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

### 5️⃣ Testar Conexão

Rode o projeto e teste no console do navegador:

```bash
npm run dev
```

No console (F12):

```javascript
import { supabase } from './services/supabase';

// Testar conexão
const { data, error } = await supabase.from('templates').select('*');
console.log('Templates:', data);
// Deve retornar 2 templates
```

---

## 🐛 Troubleshooting

### Erro: "relation already exists"
- Significa que a tabela já foi criada
- Pode pular essa migration ou deletar a tabela antes

### Erro: "permission denied"
- Verifique se está logado no Supabase
- Tente recarregar a página

### Erro: "syntax error"
- Verifique se copiou TODO o conteúdo do arquivo
- Certifique-se de não ter cortado nenhuma linha

### Nenhuma tabela aparece
- Verifique se as queries foram executadas com sucesso
- Olhe a aba "Results" no SQL Editor para ver erros

---

## ✅ Checklist Final

Antes de prosseguir, confirme:

- [ ] 6 migrations executadas sem erros
- [ ] 6 tabelas visíveis no Table Editor
- [ ] 2 templates na tabela templates
- [ ] Variáveis de ambiente configuradas
- [ ] Conexão testada e funcionando

---

## 🎯 Próximos Passos

Após executar as migrations com sucesso, podemos:

1. **Gerar tipos TypeScript** do banco de dados
2. **Criar serviços** para CRUD de quizzes
3. **Implementar autenticação** real
4. **Atualizar componentes** para usar o banco
5. **Configurar webhook** da Kiwify

---

**Dúvidas? Me avise se encontrar algum erro durante a execução!** 🚀
