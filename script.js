// ====== CONFIGURATION STEP ======
const SUPABASE_URL = "https://ztojbyfbyidzzrqicjvn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qeRJ-QyT9qEuVSG4DFVL3g_An-j7QPC";

let supabaseClientInstance = null;

// ====== INITIALIZATION ROUTINE ======
/**
 * Inicializa y retorna la instancia única del cliente de Supabase.
 * @returns {SupabaseClient} Instancia del cliente de Supabase.
 */
function getSupabaseClient() {
  if (!supabaseClientInstance) {
    // FIX: Using window.supabase explicitly to avoid variable clashing and infinite loops
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      try {
        if (typeof createClient !== 'undefined') {
          supabaseClientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
      } catch (error) {
        console.error("Error: 'createClient' no está definido. Asegúrate de instalar/importar el SDK de Supabase.");
      }
    }
  }
  return supabaseClientInstance;
}

// FIX: Renamed local variable to 'supabaseClient' to completely prevent global window context clashing
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
                    <div class="bg-gray-100 border border-gray-200 rounded p-4 relative opacity-85">
                        <span class="absolute top-2 right-2 text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded ${badgeColor}">${prop.status}</span>
                        <h4 class="font-bold text-gray-800 text-sm mt-2 truncate">${prop.resort_name || 'Unknown'}</h4>
                        <p class="text-xs text-gray-600 font-medium">$${Number(prop.asking_price || 0).toLocaleString()}</p>
                    </div>
                `;
            });
            pastContainer.innerHTML = pastHTML.join('');
        }
    } catch (error) {
        console.error("Error loading marketplace assets:", error.message);
    }
}
