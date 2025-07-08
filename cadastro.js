// Esta função é chamada pelo onclick no botão do cadastro.html
async function cadastrar() {
    // Certifique-se de que _supabase está disponível globalmente antes de usá-lo
    if (typeof window._supabase === 'undefined') {
        console.error('Supabase client not initialized. Make sure supabaseClient.js is loaded before cadastro.js');
        return;
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensagemStatus = document.getElementById('mensagemStatus');

    mensagemStatus.textContent = 'Criando sua conta...';
    mensagemStatus.style.color = 'black'; // Resetar a cor para o padrão

    const { data, error } = await window._supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        mensagemStatus.textContent = `Erro no cadastro: ${error.message}`;
        mensagemStatus.style.color = 'red';
    } else {
        mensagemStatus.textContent = 'Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.';
        mensagemStatus.style.color = 'green';
        // Opcional: Limpar campos após o sucesso
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    }
}