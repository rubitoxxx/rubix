// --- 1. INICIALIZAÇÃO DO SUPABASE ---
// Certifique-se de que a biblioteca Supabase é carregada ANTES deste script no HTML.
const SUPABASE_URL = 'https://ldrcfomamlzpxoucpkmb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcmNmb21hbWx6cHhvdWNwa21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjA4MjksImV4cCI6MjA2NzM5NjgyOX0.jsqMGgsa9qOMVQvX7bdS70lFvJ7f7TEpm3ggEtV-tL0';

// A função createClient é exportada pela biblioteca Supabase.
// Certifique-se que o script do Supabase CDN está carregado no seu HTML.
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- 2. PEGANDO OS ELEMENTOS DO HTML ---
// Estes elementos precisam existir no seu arquivo index.html.
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login-button'); // ID correto do botão no seu HTML
const mensagemErro = document.getElementById('mensagemErro');


// --- 3. FUNÇÃO DE LOGIN ---
async function login() {
    // Limpa qualquer mensagem de erro anterior ao tentar um novo login.
    mensagemErro.textContent = ''; 
    const email = emailInput.value;
    const password = passwordInput.value;

    // Verifica se os campos estão preenchidos.
    if (!email || !password) {
        mensagemErro.textContent = 'Por favor, preencha o e-mail e a senha.';
        return; // Sai da função se os campos estiverem vazios.
    }

    // Tenta fazer login usando o Supabase.
    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    // Trata o resultado do login.
    if (error) {
        console.error('Erro no login:', error.message);
        // Exibe uma mensagem de erro amigável para o usuário.
        mensagemErro.textContent = 'E-mail ou senha inválidos. Tente novamente.';
    } else {
        console.log('Login realizado com sucesso:', data.user);
        alert('Login realizado com sucesso! Redirecionando...');
        // Redireciona o usuário para a página do mural após o login bem-sucedido.
        window.location.href = 'mural.html'; 
    }
}

// --- 4. ADICIONA O EVENT LISTENER AO BOTÃO DE LOGIN ---
// Isso garante que a função 'login' seja chamada quando o botão for clicado.
if (loginButton) {
    loginButton.addEventListener('click', login);
} else {
    console.error("Botão de login com ID 'login-button' não encontrado no DOM.");
}

// Opcional: Adicionar listener para o "Enter" nos campos de input
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        // Verifica se o foco está nos campos de email ou senha
        if (document.activeElement === emailInput || document.activeElement === passwordInput) {
            login();
        }
    }
});