// ====== CONFIGURATION STEP ======
const SUPABASE_URL = "https://ztojbyfbyidzzrqicjvn.supabase.co";
// Asegúrate de que esta sea la clave "anon public" de tu panel de Supabase
const SUPABASE_ANON_KEY = "sb_publishable_qeRJ-QyT9qEuVSG4DFVL3g_An-j7QPC";

let supabaseClientInstance = null;

// ====== INITIALIZATION ROUTINE ======
document.addEventListener("DOMContentLoaded", () => {
    if (typeof supabase !== 'undefined') {
        supabaseClientInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error("Supabase engine connection block detected. Ensure unpkg script loaded correctly.");
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

// ====== CONFIGURATION STEP ======
// FIX: Uso estricto de tu URL dedicada para romper el congelamiento en "Loading properties..."
const SUPABASE_URL = "https://supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qeRJ-QyT9qEuVSG4DFVL3g_An-j7QPC";

let supabaseClientInstance = null;

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
                    btn.addEventListener('click', (e) => {
                        trackPageImpression(e.target.dataset.id);
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

async function trackPageImpression(propertyId) {
    if (!supabaseClientInstance || !propertyId) return;
    try {
        await supabaseClientInstance.rpc('increment_view_counter', { row_id: propertyId });
    } catch (error) {
        console.error("Tracking impression failed:", error.message);
    }
}

// ====== CLIENT PORTAL CORE AUTHENTICATION ENGINE ======
function setupPortalAuthentication() {
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("auth-email")?.value.trim();
        const inputPassword = document.getElementById("auth-password")?.value.trim();
        const errorMsg = document.getElementById("login-error");

        if (errorMsg) errorMsg.classList.add("hidden");
        if (!email || !inputPassword) return;

        try {
            // Autenticación nativa y segura con Supabase Auth
            const { data: authData, error: authError } = await supabaseClientInstance.auth.signInWithPassword({
                email: email,
                password: inputPassword,
            });

            if (authError || !authData.user) {
                if (errorMsg) errorMsg.classList.remove("hidden");
                return;
            }
            
            // Obtenemos los detalles adicionales del cliente vinculando el auth.uid()
            const { data: userAccount, error: clientError } = await supabaseClientInstance
                .from('clients')
                .select('*')
                .eq('id', authData.user.id)
                .maybeSingle();

            if (clientError || !userAccount) {
                console.error("Client profile not found:", clientError?.message);
                if (errorMsg) errorMsg.classList.remove("hidden");
                return;
            }
            
            // Obtenemos las propiedades asociadas al cliente
            const { data: properties, error: propError } = await supabaseClientInstance
                .from('properties')
                .select('*')
                .eq('owner_id', userAccount.id);

            if (propError) throw propError;

            // Transición visual exitosa del dashboard
            document.getElementById("login-card")?.classList.add("hidden");
            document.getElementById("portal-dashboard")?.classList.remove("hidden");
            
            const ownerTitle = document.getElementById("owner-title");
            if (ownerTitle) ownerTitle.innerText = `Welcome back, ${userAccount.client_name}`;

            if (properties && properties.length > 0) {
                const myProp = properties[0];
                
                const finalMetricViews = myProp.manual_views_override !== null 
                    ? myProp.manual_views_override 
                    : myProp.auto_views_count;

                const metricViewsEl = document.getElementById("metric-views");
                if (metricViewsEl) metricViewsEl.innerText = Number(finalMetricViews).toLocaleString();

                // Rellenado de campos de detalles del inmueble asignado al dueño logueado
                const resortEl = document.getElementById("detail-resort");
                if (resortEl) resortEl.innerText = myProp.resort_name || 'N/A';

                const priceEl = document.getElementById("detail-price");
                if (priceEl) priceEl.innerText = `$${Number(myProp.asking_price || 0).toLocaleString()}`;

                const weekEl = document.getElementById("detail-week");
                if (weekEl) weekEl.innerText = `Week ${myProp.week_number || 'N/A'}`;

                const typeEl = document.getElementById("detail-type");
                if (typeEl) typeEl.innerText = myProp.listing_type || 'N/A';

                // Ejecución automática del libro de ofertas vinculadas al ID del inmueble
                loadPropertyOffers(myProp.id);
            }
        } catch (error) {
            console.error("Login process error:", error.message);
        }
    });
}

// ====== OFFERS DATA RENDERING GRID UTILITIES ======
async function loadPropertyOffers(propertyId) {
    if (!propertyId) return;
    try {
        let { data: offersList, error } = await supabaseClientInstance
            .from('offers')
            .select('*')
            .eq('property_id', propertyId)
            .order('date_received', { ascending: false });

        if (error) throw error;

        const ledgerBody = document.getElementById("offers-ledger-body");
        if (!ledgerBody) return;
        
        if (offersList && offersList.length > 0) {
            ledgerBody.innerHTML = '';
            offersList.forEach(off => {
                const dateStr = off.date_received ? new Date(off.date_received).toLocaleDateString() : 'Recent';
                let badgeClass = 'bg-yellow-100 text-yellow-800';
                if (off.status === 'ACCEPTED') badgeClass = 'bg-green-100 text-green-800';
                if (off.status === 'DECLINED') badgeClass = 'bg-red-100 text-red-800';

                ledgerBody.innerHTML += `
                    <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                        <td class="p-3 text-gray-600 font-medium">${dateStr}</td>
                        <td class="p-3"><span class="text-xs uppercase font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded">${off.offer_type}</span></td>
                        <td class="p-3 font-bold text-gray-900">$${Number(off.offer_amount || 0).toLocaleString()}</td>
                        <td class="p-3 text-center"><span class="text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}">${off.status}</span></td>
                    </tr>
                `;
            });
        }
    } catch (err) {
        console.error("Error fetching offers ledger:", err.message);
    }
}

// ====== LEAD GENERATION INTAKE UTILITIES ======
function setupLeadSubmission() {
    const leadForm = document.getElementById("general-lead-form");
    if (!leadForm) return;

    leadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const payload = {
            name: document.getElementById("lead-name").value,
            email: document.getElementById("lead-email").value,
            message: document.getElementById("lead-message").value
        };

        alert(`Thank you, ${payload.name}! Our agents at Timeshare Management Group have received your request and will follow up shortly.`);
        leadForm.reset();
    });
}

// Despliegue de actualización limpia forzada final v1.0.6
