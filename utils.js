// utils.js

// --- INICIALIZAÇÃO DO SUPABASE ---
const supabaseUrl = 'https://ldrcfomamlzpxoucpkmb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcmNmb21hbWx6cHhvdWNwa21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjA4MjksImV4cCI6MjA2NzM5NjgyOX0.jsqMGgsa9qOMVQvX7bdS70lFvJ7f7TEpm3ggEtV-tL0';

const { createClient } = supabase;
window._supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Adiciona uma quantidade específica de RubixCoins ao saldo de um usuário.
 * @param {string} userId - O ID do usuário no Supabase.
 * @param {number} amount - A quantidade de RubixCoins a ser adicionada.
 */
async function adicionarRubixCoins(userId, amount) {
    const { data: profile, error: fetchError } = await window._supabase
        .from('profiles')
        .select('rubix_coins')
        .eq('id', userId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar saldo de RubixCoins:', fetchError);
        return;
    }

    const currentCoins = profile ? profile.rubix_coins : 0;
    const newCoins = currentCoins + amount;

    const { error: updateError } = await window._supabase
        .from('profiles')
        .update({ rubix_coins: newCoins })
        .eq('id', userId);

    if (updateError) {
        console.error(`Erro ao adicionar ${amount} RubixCoins para o usuário ${userId}:`, updateError);
    } else {
        console.log(`${amount} RubixCoins adicionadas para o usuário ${userId}. Novo saldo: ${newCoins}`);
    }
}
// --- FIM DA FUNÇÃO adicionarRubixCoins ---


/**
 * Subtrai uma quantidade específica de RubixCoins do saldo de um usuário.
 * @param {string} userId - O ID do usuário no Supabase.
 * @param {number} amount - A quantidade de RubixCoins a ser gasta.
 * @returns {Promise<boolean>} - Retorna true se a operação foi bem-sucedida, false caso contrário.
 */
async function gastarRubixCoins(userId, amount) {
    const { data: profile, error: fetchError } = await window._supabase
        .from('profiles')
        .select('rubix_coins')
        .eq('id', userId)
        .single();

    if (fetchError) {
        console.error('Erro ao buscar saldo para gastar RubixCoins:', fetchError);
        return false;
    }

    const currentCoins = profile.rubix_coins || 0;

    if (currentCoins < amount) {
        console.log(`Usuário ${userId} não tem ${amount} RubixCoins para gastar. Saldo atual: ${currentCoins}`);
        return false;
    }

    const newCoins = currentCoins - amount;

    const { error: updateError } = await window._supabase
        .from('profiles')
        .update({ rubix_coins: newCoins })
        .eq('id', userId);

    if (updateError) {
        console.error(`Erro ao gastar ${amount} RubixCoins para o usuário ${userId}:`, updateError);
        return false;
    }

    console.log(`${amount} RubixCoins gastas pelo usuário ${userId}. Novo saldo: ${newCoins}`);
    return true;
}
// --- FIM DA FUNÇÃO gastarRubixCoins ---


// Exponha as funções globalmente para serem usadas em outros arquivos
window.adicionarRubixCoins = adicionarRubixCoins;
window.gastarRubixCoins = gastarRubixCoins;