// ====== CONFIGURATION STEP ======
// Intenta leer desde las variables del sistema inyectadas por Vercel, si no existen, usa las cadenas por defecto.
const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) 
  || window._env_?.NEXT_PUBLIC_SUPABASE_URL 
  || "https://ztojbyfbyidzzrqicjvn.supabase.co";

const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) 
  || window._env_?.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  || "sb_publishable_qeRJ-QyT9qEuVSG4DFVL3g_An-j7QPC";

let supabaseClientInstance = null;

// ====== INITIALIZATION ROUTINE ======
/**
 * Inicializa y retorna la instancia única del cliente de Supabase.
 * @returns {SupabaseClient} Instancia del cliente de Supabase.
 */
function getSupabaseClient() {
  if (!supabaseClientInstance) {
    // FIX: Usar window.supabase de forma explícita para evitar bucles infinitos en navegadores
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      try {
        if (typeof createClient !== 'undefined') {
          supabaseClientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
      } catch (error) {
        console.error("Error: 'createClient' no está definido. Asegúrate de que el script de unpkg en tu HTML cargue primero.");
      }
    }
  }
  return supabaseClientInstance;
}

// Inicialización del cliente global seguro
const supabaseClient = getSupabaseClient();


// Automated listener routing mapping elements on load
document.addEventListener("DOMContentLoaded", () => {
    if (!supabaseClientInstance) {
        console.error("Critical connection failure: Supabase engine not initialized.");
        return;
    }
    if (document.getElementById("active-properties")) {
        loadPublicMarketplace();
        setupLeadSubmission();
    }
    if (document.getElementById("login-form")) {
        setupPortalAuthentication();
    }
});

// ====== FRONTEND UTILITIES & CAPTURE FORMS ======

/**
 * Gestiona el envío del formulario de contacto para captación de clientes potenciales.
 */
function setupLeadSubmission() {
    const leadForm = document.getElementById("general-lead-form");
    if (!leadForm) return;

    leadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("lead-name").value;
        const email = document.getElementById("lead-email").value;
        const message = document.getElementById("lead-message").value;

        try {
            // Inserta el lead directamente en tu tabla 'leads' en Supabase
            const { error } = await supabaseClientInstance
                .from('leads')
                .insert([{ full_name: name, email_address: email, message: message }]);

            if (error) throw error;

            alert("¡Solicitud enviada con éxito! Un agente se pondrá en contacto pronto.");
            leadForm.reset();
        } catch (error) {
            console.error("Error submitting lead application:", error.message);
            alert("No se pudo procesar la solicitud en este momento. Inténtalo de nuevo.");
        }
    });
}

/**
 * Controla el acceso del cliente a través del formulario de autenticación clásico.
 */
function setupPortalAuthentication() {
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("auth-email").value;
        const password = document.getElementById("auth-password").value;
        const errorMsg = document.getElementById("login-error");

        if (errorMsg) errorMsg.classList.add("hidden");

        try {
            const { data, error } = await supabaseClientInstance.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            if (data?.user) {
                document.getElementById("login-card")?.classList.add("hidden");
                const dashboard = document.getElementById("portal-dashboard");
                if (dashboard) {
                    dashboard.classList.remove("hidden");
                    document.getElementById("owner-title").innerText = `Welcome back, ${data.user.email}`;
                }
            }
        } catch (error) {
            console.error("Portal login reference error:", error.message);
            if (errorMsg) errorMsg.classList.remove("hidden");
        }
    });
}
