// Teste rápido de conexão com Supabase
// Cole este código no Console do navegador (F12)

import { supabase } from './services/supabase.ts';

console.log('🔍 Testando conexão com Supabase...');

// Teste 1: Verificar se supabase está definido
console.log('Supabase client:', supabase ? '✅ OK' : '❌ ERRO');

// Teste 2: Tentar buscar templates
const { data, error } = await supabase.from('templates').select('*');
console.log('Templates:', data);
console.log('Erro:', error);

// Teste 3: Verificar configuração de auth
const { data: { session } } = await supabase.auth.getSession();
console.log('Sessão atual:', session);

// Teste 4: Tentar criar usuário de teste
const testEmail = 'teste' + Date.now() + '@exemplo.com';
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: '123456',
    options: {
        data: {
            full_name: 'Teste'
        }
    }
});

console.log('Resultado do registro:', signUpData);
console.log('Erro do registro:', signUpError);
