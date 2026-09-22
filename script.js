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

// Automatización del enrutamiento de eventos tras la carga del DOM
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

// ====== FRONTEND PUBLIC CATALOG UTILITIES ======
async function loadPublicMarketplace() {
    try {
        const [activeResult, pastResult] = await Promise.all([
            supabaseClientInstance.from('properties').select('*').eq('status', 'AVAILABLE'),
            supabaseClientInstance.from('properties').select('*').in('status', ['SOLD', 'RENTED']).order('created_at', { ascending: false })
        ]);

        const { data: activeList, error: err1 } = activeResult;
        const { data: pastList, error: err2 } = pastResult;

        if (err1) throw err1;
        if (err2) throw err2;

        const activeContainer = document.getElementById("active-properties");
        if (activeContainer && activeList) {
            if (activeList.length === 0) {
                activeContainer.innerHTML = '<p class="text-gray-500 col-span-3">No active assets listed right now.</p>';
            } else {
                const activeHTML = activeList.map(prop => `
                    <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition">
                        <div class="p-5">
                            <span class="inline-block text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded mb-2">${prop.listing_type || 'N/A'}</span>
                            <h3 class="text-lg font-bold text-gray-900">${prop.resort_name || 'Unknown Resort'}</h3>
                            <p class="text-gray-500 text-sm mb-4">Assigned Week: ${prop.week_number || 'N/A'}</p>
                            <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                                <span class="text-xl font-extrabold text-blue-900">$${Number(prop.asking_price || 0).toLocaleString()}</span>
                                <button data-id="${prop.id}" class="inquire-btn bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-blue-800 transition">Inquire</button>
                            </div>
                        </div>
                    </div>
                `);
                activeContainer.innerHTML = activeHTML.join('');
                
                activeContainer.querySelectorAll('.inquire-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.getElementById("contact")?.scrollIntoView({ behavior: 'smooth' });
                    });
                });
            }
        }

               const pastContainer = document.getElementById("past-properties");
        if (pastContainer && pastList) {
            const pastHTML = pastList.map(prop => {
                const badgeColor = prop.status === 'SOLD' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
                return `
                    <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-5 relative overflow-hidden hover:shadow-md transition opacity-90">
                        <span class="absolute top-3 right-3 text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded ${badgeColor}">${prop.status}</span>
                        <span class="inline-block text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded mb-2">${prop.listing_type || 'N/A'}</span>
                        <h4 class="font-bold text-gray-900 text-base truncate pr-12">${prop.resort_name || 'Unknown'}</h4>
                        <p class="text-gray-500 text-xs mb-3">Assigned Week: ${prop.week_number || 'N/A'}</p>
                        <div class="pt-2 border-t border-gray-100">
                            <p class="text-lg font-extrabold text-blue-900">$${Number(prop.asking_price || 0).toLocaleString()}</p>
                        </div>
                    </div>
                `;
            });
            pastContainer.innerHTML = pastHTML.join('');
        }

// ====== FRONTEND UTILITIES & CAPTURE FOR Forms ======

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
                    
                    // Dispara la carga dinámica de ofertas del usuario autenticado
                    loadUserOffers(data.user.id);
                }
            }
        } catch (error) {
            console.error("Portal login reference error:", error.message);
            if (errorMsg) errorMsg.classList.remove("hidden");
        }
    });
}

/**
 * Busca y renderiza las ofertas asociadas al usuario autenticado en el Offers Ledger.
 * @param {string} userId - ID del usuario de Supabase Auth.
 */
async function loadUserOffers(userId) {
    const ledgerBody = document.getElementById("offers-ledger-body");
    if (!ledgerBody) return;

    try {
        const { data: offers, error } = await supabaseClientInstance
            .from('offers')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!offers || offers.length === 0) {
            ledgerBody.innerHTML = `
                <tr>
                    <td colspan="4" class="p-4 text-center text-gray-400 text-xs">No offers recorded for your property yet.</td>
                </tr>`;
            return;
        }

        ledgerBody.innerHTML = offers.map(off => {
            let statusColor = "bg-yellow-100 text-yellow-800"; // PENDING
            if (off.status === 'ACCEPTED') statusColor = "bg-green-100 text-green-800";
            if (off.status === 'REJECTED') statusColor = "bg-red-100 text-red-800";

            return `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3 text-xs text-gray-600">${new Date(off.created_at).toLocaleDateString()}</td>
                    <td class="p-3 font-medium">${off.offer_type || 'Purchase'}</td>
                    <td class="p-3 font-bold text-blue-900">$${Number(off.amount || 0).toLocaleString()}</td>
                    <td class="p-3 text-center">
                        <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded ${statusColor}">${off.status || 'PENDING'}</span>
                    </td>
                </tr>`;
        }).join('');

    } catch (error) {
        console.error("Error loading ledger offers:", error.message);
        ledgerBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500 text-xs">Failed to load offers ledger.</td></tr>`;
    }
}
