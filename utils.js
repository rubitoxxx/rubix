// utils.js

// --- INICIALIZAÇÃO DO SUPABASE ---
// Estes dados são sensíveis e em produção deveriam estar em um backend.
// Para este projeto de faculdade, mantê-los aqui é comum.
const supabaseUrl = 'https://ldrcfomamlzpxoucpkmb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcmNmb21hbWx6cHhvdWNwa21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjA4MjksImV4cCI6MjA2NzM5NjgyOX0.jsqMGgsa9qOMVQvX7bdS70lFvJ7f7TEpm3ggEtV-tL0';

// A instância do Supabase deve ser globalmente acessível se utils.js for importado primeiro
const { createClient } = supabase;
window._supabase = createClient(supabaseUrl, supabaseKey); // Atribuir a window para globalizar

/**
 * Adiciona uma quantidade específica de RubixCoins ao saldo de um usuário.
 * @param {string} userId - O ID do usuário no Supabase.
 * @param {number} amount - A quantidade de RubixCoins a ser adicionada.
 */
async function adicionarRubixCoins(userId, amount) {
    // Pega o saldo atual do usuário
    const { data: profile, error: fetchError } = await window._supabase
        .from('profiles')
        .select('rubix_coins')
        .eq('id', userId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 indica "no rows found", o que é ok se for um novo perfil
        console.error('Erro ao buscar saldo de RubixCoins:', fetchError);
        return;
    }

    const currentCoins = profile ? profile.rubix_coins : 0;
    const newCoins = currentCoins + amount;

    // Atualiza o saldo de RubixCoins no banco de dados
    const { error: updateError } = await window._supabase
        .from('profiles')
        .update({ rubix_coins: newCoins })
        .eq('id', userId);

    if (updateError) {
        console.error(`Erro ao adicionar ${amount} RubixCoins para o usuário ${userId}:`, updateError);
    } else {
        console.log(`${amount} RubixCoins adicionadas para o usuário ${userId}. Novo saldo: ${newCoins}`);
        // Opcional: Feedback visual aqui se estiver no contexto de uma página com exibição de saldo
        // Por exemplo, uma pequena notificação "Você ganhou X RubixCoins!"
    }
}

// Opcional: Você pode expor a função globalmente se for preciso ser acessada diretamente por outros scripts
window.adicionarRubixCoins = adicionarRubixCoins;

// Exemplo de como carregar o usuário atual ao carregar utils.js, se for necessário em todas as páginas
// let currentUser = null;
// document.addEventListener('DOMContentLoaded', async () => {
//     const { data: { session } } = await window._supabase.auth.getSession();
//     if (session) {
//         currentUser = session.user;
//         // Você pode, por exemplo, armazenar currentUser na window também:
//         // window.currentUser = currentUser;
//     }
// });