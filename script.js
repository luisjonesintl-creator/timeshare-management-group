// ====== CONFIGURATION STEP ======
const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) 
  || window._env_?.NEXT_PUBLIC_SUPABASE_URL 
  || "https://ztojbyfbyidzzrqicjvn.supabase.co"

const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) 
  || window._env_?.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  || "sb_publishable_qeRJ-QyT9qEuVSG4DFVL3g_An-j7QPC";

let supabaseClientInstance = null;

// ====== INITIALIZATION ROUTINE ======
function getSupabaseClient() {
  if (!supabaseClientInstance) {
    const creator = window.supabase?.createClient || window.createClient || (typeof createClient !== 'undefined' ? createClient : null);
    if (creator) {
      supabaseClientInstance = creator(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }
  return supabaseClientInstance;
}

// Rutina de arranque segura con tolerancia a retrasos de red
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const client = getSupabaseClient();
        if (!client) {
            console.error("Critical connection failure: Supabase engine not initialized.");
            return;
        }
        
        if (document.getElementById("active-properties")) {
            loadPublicMarketplace(client);
            setupLeadSubmission(client);
        }
        if (document.getElementById("login-form")) {
            setupPortalAuthentication(client);
        }
    }, 300);
});

// ====== FRONTEND PUBLIC CATALOG UTILITIES ======
async function loadPublicMarketplace(client) {
    try {
        const [activeResult, pastResult] = await Promise.all([
            client.from('properties').select('*').eq('status', 'AVAILABLE'),
            client.from('properties').select('*').in('status', ['SOLD', 'RENTED']).order('created_at', { ascending: false })
        ]);

        const { data: activeList, error: err1 } = activeResult;
        const { data: pastList, error: err2 } = pastResult;

        if (err1) throw err1;
        if (err2) throw err2;

        const activeContainer = document.getElementById("active-properties");
        if (activeContainer) {
            // CONTROL DE SEGURIDAD: Si no hay propiedades disponibles, mostramos un mensaje descriptivo
            if (!activeList || activeList.length === 0) {
                activeContainer.innerHTML = `
                    <div class="col-span-1 md:col-span-3 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <p class="text-blue-900 font-semibold text-sm">No active luxury assets listed for sale right now.</p>
                        <p class="text-blue-700 text-xs mt-1">Please contact an agent below to discover upcoming timeshare opportunities.</p>
                    </div>`;
            } else {
                const activeHTML = activeList.map(prop => {
                    const imageHeader = prop.image_url 
                        ? `<div class="h-48 w-full overflow-hidden bg-gray-100">
                            <img src="${prop.image_url}" alt="${prop.resort_name}" class="h-full w-full object-cover">
                           </div>`
                        : `<div class="h-32 w-full bg-gradient-to-r from-blue-900 to-indigo-950 flex items-center justify-center">
                            <span class="text-white text-xs font-semibold opacity-75">TMG Luxury Properties</span>
                           </div>`;

                    return `
                        <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition flex flex-col justify-between">
                            <div>
                                ${imageHeader}
                                <div class="p-5">
                                    <span class="inline-block text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded mb-2">${prop.listing_type || 'N/A'}</span>
                                    <h3 class="text-lg font-bold text-gray-900">${prop.resort_name || 'Unknown Resort'}</h3>
                                    <p class="text-gray-500 text-sm">Assigned Week: ${prop.week_number || 'N/A'}</p>
                                </div>
                            </div>
                            <div class="p-5 pt-0">
                                <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <span class="text-xl font-extrabold text-blue-900">$${Number(prop.asking_price || 0).toLocaleString()}</span>
                                    <button data-id="${prop.id}" class="inquire-btn bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-blue-800 transition">Inquire</button>
                                </div>
                            </div>
                        </div>
                    `;
                });
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
            if (!pastList || pastList.length === 0) {
                pastContainer.innerHTML = '<p class="text-gray-400 text-xs col-span-3">No historical records available.</p>';
            } else {
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
        }
    } catch (error) {
        console.error("Error loading marketplace assets:", error.message);
    }
}

// ====== FRONTEND UTILITIES & CAPTURE FOR FORMS ======
function setupLeadSubmission(client) {
    const leadForm = document.getElementById("general-lead-form");
    if (!leadForm) return;

    leadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("lead-name").value;
        const email = document.getElementById("lead-email").value;
        const message = document.getElementById("lead-message").value;

        try {
            const { error } = await client
                .from('leads')
                .insert([{ full_name: name, email_address: email, message: message }]);

            if (error) throw error;

            alert("¡Solicitud enviada con éxito! Un agente se pondrá en contacto pronto.");
            leadForm.reset();
        } catch (error) {
            console.error("Error submitting lead application:", error.message);
            alert("No se pudo procesar la solicitud en este momento.");
        }
    });
}

function setupPortalAuthentication(client) {
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("auth-email").value;
        const password = document.getElementById("auth-password").value;
        const errorMsg = document.getElementById("login-error");

        if (errorMsg) errorMsg.classList.add("hidden");

        try {
            const { data, error } = await client.auth.signInWithPassword({
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
                    loadUserOffers(client, data.user.id);
                }
            }
        } catch (error) {
            console.error("Portal login reference error:", error.message);
            if (errorMsg) errorMsg.classList.remove("hidden");
        }
    });
}

async function loadUserOffers(client, userId) {
    const ledgerBody = document.getElementById("offers-ledger-body");
    if (!ledgerBody) return;

    try {
        const { data: offers, error } = await client
            .from('offers')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!offers || offers.length === 0) {
            ledgerBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400 text-xs">No offers recorded for your property yet.</td></tr>`;
            return;
        }

        ledgerBody.innerHTML = offers.map(off => {
            let statusColor = "bg-yellow-100 text-yellow-800";
            if (off.status === 'ACCEPTED') statusColor = "bg-green-100 text-green-800";
            if (off.status === 'REJECTED') statusColor = "bg-red-100 text-red-800";

            return `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3 text-xs text-gray-600">${new Date(off.created_at).toLocaleDateString()}</td>
                    <td class="p-3 font-medium">${off.offer_type || 'Purchase'}</td>
                    <td class="p-3 font-bold text-blue-900">$${Number(off.amount || 0).toLocaleString()}</td>
                    <td class="p-3 text-center"><span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded ${statusColor}">${off.status || 'PENDING'}</span></td>
                </tr>`;
        }).join('');

    } catch (error) {
        console.error("Error loading ledger offers:", error.message);
    }
}
