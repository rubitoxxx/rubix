// =================================================================
// ARQUIVO: login.js
// FUNÇÃO: Gerencia a autenticação na página de login.
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const mensagemErro = document.getElementById('mensagemErro');

    loginButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Limpa erros anteriores
        mensagemErro.textContent = '';
        
        if (!email || !password) {
            mensagemErro.textContent = 'Por favor, preencha o e-mail e a senha.';
            return;
        }

        // Desabilita o botão para evitar cliques múltiplos
        loginButton.disabled = true;
        loginButton.textContent = 'Entrando...';

        try {
            const { data, error } = await window._supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                throw error; // Joga o erro para o bloco catch
            }

            // Se o login for bem-sucedido, redireciona para o mural
            if (data.session) {
                window.location.href = 'mural.html';
            }

        } catch (error) {
            console.error('Erro no login:', error.message);
            mensagemErro.textContent = 'E-mail ou senha inválidos. Tente novamente.';
        } finally {
            // Reabilita o botão
            loginButton.disabled = false;
            loginButton.textContent = 'Entrar';
        }
    });
});