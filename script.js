
// --- 1. INICIALIZAÇÃO DO SUPABASE ---
// Esta parte depende da biblioteca que é carregada primeiro no index.html
const SUPABASE_URL = 'https://ldrcfomamlzpxoucpkmb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcmNmb21hbWx6cHhvdWNwa21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjA4MjksImV4cCI6MjA2NzM5NjgyOX0.jsqMGgsa9qOMVQvX7bdS70lFvJ7f7TEpm3ggEtV-tL0';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- 2. PEGANDO OS ELEMENTOS DO HTML ---
// Estas linhas precisam vir ANTES da função que as utiliza.
const emailInput = document.getElementById('email'); // Certifique-se que o id no index.html é 'email'
const passwordInput = document.getElementById('password');
const mensagemErro = document.getElementById('mensagemErro');


// --- 3. FUNÇÃO DE LOGIN ---
async function login() {
  // Agora 'mensagemErro' já existe e pode ser usada aqui.
  mensagemErro.textContent = ''; 
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    mensagemErro.textContent = 'Por favor, preencha o e-mail e a senha.';
    return;
  }

  const { data, error } = await _supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Erro no login:', error.message);
    mensagemErro.textContent = 'E-mail ou senha inválidos. Tente novamente.';
  } else {
    console.log('Login realizado com sucesso:', data.user);
    alert('Login realizado com sucesso! Redirecionando...');
    window.location.href = 'mural.html'; 
  }
}