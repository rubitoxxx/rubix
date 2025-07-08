// --- utils.js ---
// Este arquivo DEVE ser carregado DEPOIS de supabaseClient.js no seu HTML.
// Ele expõe funções globais para manipulação de RubixCoins e lógica de animação.

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
            
            // Disparar evento para a animação da moeda, se necessário.
            // É melhor que a animação seja ouvida em um script específico da página (ex: mural.js)
            // ou aqui, mas fora do DOMContentLoaded se for para acontecer logo.
            const event = new CustomEvent('rubixcoin-gasta', { detail: { userId, amount, newCoins } });
            window.dispatchEvent(event);
            return true;
        } catch (e) {
            console.error("Erro inesperado em gastarRubixCoins:", e);
            return false;
        }
    };
}


// --- Lógica para a animação da moeda ---
// Esta parte pode ficar no DOMContentLoaded se depender de elementos HTML.
// No entanto, se o coinAnimationContainer existe sempre que utils.js é usado,
// pode-se manter fora para simplificar. Vou manter no DOMContentLoaded para segurança.
document.addEventListener('DOMContentLoaded', () => {
    const coinAnimationContainer = document.getElementById('coin-animation-container');
    if (coinAnimationContainer) { // Verificar se o elemento existe na página
        window.addEventListener('rubixcoin-gasta', () => {
            const coinImage = document.createElement('img');
            coinImage.src = 'coin.png'; // Certifique-se que 'coin.png' está no mesmo diretório (ou o caminho correto)
            coinImage.classList.add('coin-animation');
            coinAnimationContainer.appendChild(coinImage);

            // Inicia a animação de fade-out e remoção após um atraso.
            // Ajuste os tempos conforme a duração da sua animação CSS.
            setTimeout(() => {
                coinImage.classList.add('fade-out');
                setTimeout(() => {
                    coinImage.remove();
                }, 500); // Duração do fade-out
            }, 1500); // Atraso antes de iniciar o fade-out
        });
    }
});