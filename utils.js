// --- 1. INICIALIZAÇÃO DO SUPABASE ---
// Este bloco configura a conexão com seu banco de dados Supabase.

const SUPABASE_URL = 'https://ldrcfomamlzpxoucpkmb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcmNmb21hbWx6cHhvdWNwa21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjA4MjksImV4cCI6MjA2NzM5NjgyOX0.jsqMGgsa9qOMVQvX7bdS70lFvJ7f7TEpm3ggEtV-tL0';

const { createClient } = supabase;

// A instância do cliente Supabase é colocada no objeto 'window'.
// Isso a torna uma variável "global", acessível em qualquer outro script,
// como no seu 'mural.html', usando 'window._supabase'.
window._supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- 2. FUNÇÃO PARA GERENCIAR RUBIXCOINS ---
// Esta é a função corrigida que agora retorna um valor em todos os cenários.

/**
 * Adiciona ou remove RubixCoins de um usuário.
 * @param {string} userId - O ID do usuário.
 * @param {number} amount - A quantidade a ser adicionada (pode ser negativa para remover).
 * @returns {Promise<{error: any}>} - Retorna um objeto com uma chave de erro. O erro será 'null' se tudo ocorrer bem.
 */
async function adicionarRubixCoins(userId, amount) {
    // Validação básica para garantir que os dados de entrada são válidos.
    if (!userId || typeof amount !== 'number') {
        const error = new Error("ID do usuário ou quantidade inválida.");
        console.error(error.message);
        return { error }; // Retorna um objeto com o erro
    }

    try {
        // Passo 1: Pega o saldo atual do usuário direto do banco de dados para segurança.
        const { data: profile, error: fetchError } = await window._supabase
            .from('profiles')
            .select('rubix_coins')
            .eq('id', userId)
            .single();

        if (fetchError) {
            console.error("Erro ao buscar RubixCoins para o usuário:", userId, fetchError);
            return { error: fetchError }; // Retorna o erro do Supabase
        }

        const currentCoins = profile.rubix_coins || 0;
        const newBalance = currentCoins + amount;

        // Passo 2: Atualiza o saldo do usuário no banco de dados.
        const { error: updateError } = await window._supabase
            .from('profiles')
            .update({ rubix_coins: newBalance })
            .eq('id', userId);

        if (updateError) {
            console.error("Erro ao atualizar RubixCoins para o usuário:", userId, updateError);
            return { error: updateError }; // Retorna o erro do Supabase
        }

        // Log para depuração, informando que a operação foi bem-sucedida.
        console.log(`${amount} RubixCoins adicionadas para o usuário ${userId}. Novo saldo: ${newBalance}`);
        
        // CORREÇÃO PRINCIPAL: Retorna um objeto indicando sucesso (erro é nulo).
        // É por causa da falta desta linha que o erro acontecia.
        return { error: null };

    } catch (error) {
        // Captura qualquer outro erro inesperado que possa acontecer.
        console.error("Erro inesperado na função adicionarRubixCoins:", error);
        return { error }; // Retorna o erro
    }
}

// A função de moedas também é colocada no objeto 'window' para se tornar global,
// permitindo que seja chamada a partir de 'mural.html' usando 'window.adicionarRubixCoins'.
window.adicionarRubixCoins = adicionarRubixCoins;