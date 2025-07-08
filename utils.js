// utils.js

// Verificação robusta para garantir que window._supabase existe.
// Esta verificação deve ser feita ANTES de qualquer função tentar usá-lo.
if (typeof window._supabase === 'undefined') {
    console.error("ERRO GRAVE: Supabase client não inicializado. Verifique se 'supabaseClient.js' foi carregado antes de 'utils.js'.");
    // Para evitar erros de referência, definimos stubs que alertam o problema.
    window.adicionarRubixCoins = async (userId, amount) => {
        alert("Erro: Sistema de moedas indisponível. Supabase não inicializado.");
        console.error("Chamada a adicionarRubixCoins com Supabase não inicializado.");
        return false;
    };
    window.gastarRubixCoins = async (userId, amount) => {
        alert("Erro: Sistema de moedas indisponível. Supabase não inicializado.");
        console.error("Chamada a gastarRubixCoins com Supabase não inicializado.");
        return false;
    };
} else {
    /**
     * Adiciona uma quantidade específica de RubixCoins ao saldo de um usuário.
     * Cria um perfil se não existir.
     * @param {string} userId - O ID do usuário no Supabase.
     * @param {number} amount - A quantidade de RubixCoins a ser adicionada.
     * @returns {Promise<boolean>} - Retorna true se a operação foi bem-sucedida, false caso contrário.
     */
    window.adicionarRubixCoins = async (userId, amount) => {
        try {
            // Tenta buscar o perfil
            const { data: profile, error: fetchError } = await window._supabase
                .from('profiles')
                .select('rubix_coins')
                .eq('id', userId)
                .single();

            // PGRST116 indica "no rows found", o que é esperado para novos usuários.
            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Erro ao buscar saldo de RubixCoins:', fetchError);
                return false;
            }

            const currentCoins = profile ? profile.rubix_coins : 0;
            const newCoins = currentCoins + amount;

            if (!profile) {
                // Se o perfil não existe, insere um novo com o ID do usuário e o saldo inicial
                const { error: insertError } = await window._supabase
                    .from('profiles')
                    .insert([{ id: userId, rubix_coins: newCoins }]);

                if (insertError) {
                    console.error(`Erro ao criar perfil e adicionar RubixCoins para o usuário ${userId}:`, insertError);
                    return false;
                }
                console.log(`${amount} RubixCoins adicionadas (novo perfil) para o usuário ${userId}. Saldo: ${newCoins}`);
            } else {
                // Se o perfil já existe, atualiza o saldo
                const { error: updateError } = await window._supabase
                    .from('profiles')
                    .update({ rubix_coins: newCoins })
                    .eq('id', userId);

                if (updateError) {
                    console.error(`Erro ao adicionar ${amount} RubixCoins para o usuário ${userId}:`, updateError);
                    return false;
                }
                console.log(`${amount} RubixCoins adicionadas para o usuário ${userId}. Novo saldo: ${newCoins}`);
            }
            return true;
        } catch (e) {
            console.error("Erro inesperado em adicionarRubixCoins:", e);
            return false;
        }
    };

    /**
     * Subtrai uma quantidade específica de RubixCoins do saldo de um usuário.
     * @param {string} userId - O ID do usuário no Supabase.
     * @param {number} amount - A quantidade de RubixCoins a ser gasta.
     * @returns {Promise<boolean>} - Retorna true se a operação foi bem-sucedida e houver saldo suficiente, false caso contrário.
     */
    window.gastarRubixCoins = async (userId, amount) => {
        try {
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
                return false; // Saldo insuficiente
            }

            const newCoins = currentCoins - amount;

            const { error: updateError } = await window._supabase
                .from('profiles')
                .update({ rubix_coins: newCoins })
                .eq('id', userId);

            if (updateError) {
                console.error(`Erro ao gastar moedas:`, updateError.message);
                return false;
            }

            console.log(`Gastas ${amount} RubixCoins do usuário ${userId}. Novo saldo: ${newCoins}.`);
            
            // Dispara um evento personalizado para notificar que moedas foram gastas/ganhas.
            // A animação visual deve ser "ouvida" por quem se importa (ex: mural.html).
            const event = new CustomEvent('rubixcoin-updated', { detail: { userId, amount, newCoins, type: 'gasto' } });
            window.dispatchEvent(event);
            return true;
        } catch (e) {
            console.error("Erro inesperado em gastarRubixCoins:", e);
            return false;
        }
    };
}

// REMOVIDO: A lógica de animação de moeda diretamente no utils.js para o DOMContentLoaded
// Essa lógica deve estar no script da página que precisa da animação (ex: mural.html)
// e não em um arquivo de utilidade genérico.
