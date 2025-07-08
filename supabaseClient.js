// --- supabaseClient.js ---
// Este arquivo deve ser carregado ANTES de QUALQUER outro script que utilize _supabase

const SUPABASE_URL = 'https://ldrcfomamlzpxoucpkmb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcmNmb21hbWx6cHhvdWNwa21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjA4MjksImV4cCI6MjA2NzM5NjgyOX0.jsqMGgsa9qOMVQvX7bdS70lFvJ7f7TEpm3ggEtV-tL0';

// Verifica se 'supabase' está disponível globalmente, o que deve acontecer
// se a CDN do Supabase for carregada no HTML antes deste script.
if (typeof supabase === 'undefined') {
    console.error("Erro: A biblioteca do Supabase não foi carregada. Certifique-se que o CDN está no seu HTML.");
} else {
    // Cria e armazena a instância do Supabase em uma variável global (window._supabase)
    // para que outros scripts possam acessá-la facilmente.
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client inicializado e disponível como window._supabase.");
}
