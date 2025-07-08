document.addEventListener('DOMContentLoaded', () => {
    // Certifique-se de que _supabase está disponível globalmente antes de usá-lo
    if (typeof window._supabase === 'undefined') {
        console.error('Supabase client not initialized. Make sure supabaseClient.js is loaded before login.js');
        return;
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const mensagemErro = document.getElementById('mensagemErro');

    loginButton.addEventListener('click', async () => {
        mensagemErro.textContent = ''; 
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            mensagemErro.textContent = 'Por favor, preencha o e-mail e a senha.';
            return;
        }

        const { data, error } = await window._supabase.auth.signInWithPassword({
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
    });
});