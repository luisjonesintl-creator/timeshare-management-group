// ====== CONFIGURATION STEP ======
// ====== CONFIGURATION STEP ======
// FIX: Changed from general homepage link to your unique project URL database link
const SUPABASE_URL = "https://ztobjbyfbyidzzrqicjvn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0b2pieWZieWlkenpycWljanVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MzE1NTUsImV4cCI6MjEwNTUwNzU1NX0.Ap30zRwDs3z3vBjyS2ibocx5oGY3Uzft2eID26RbLKQ";


let supabaseClientInstance = null;

// ====== INITIALIZATION ROUTINE ======
document.addEventListener("DOMContentLoaded", () => {
    if (typeof supabase !== 'undefined') {
        supabaseClientInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error("Supabase engine connection block detected.");
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
    let { data: activeList, error: err1 } = await supabaseClientInstance
        .from('properties')
        .select('*')
        .eq('status', 'AVAILABLE');

    let { data: pastList, error: err2 } = await supabaseClientInstance
        .from('properties')
        .select('*')
        .in('status', ['SOLD', 'RENTED'])
        .order('created_at', { ascending: false });

    if (!err1 && activeList) {
        const activeContainer = document.getElementById("active-properties");
        activeContainer.innerHTML = activeList.length === 0 ? '<p class="text-gray-500">No active assets listed right now.</p>' : '';
        activeList.forEach(prop => {
            activeContainer.innerHTML += `
                <div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition">
                    <div class="p-5">
                        <span class="inline-block text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded mb-2">${prop.listing_type}</span>
                        <h3 class="text-lg font-bold text-gray-900">${prop.resort_name}</h3>
                        <p class="text-gray-500 text-sm mb-4">Assigned Week: ${prop.week_number || 'N/A'}</p>
                        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span class="text-xl font-extrabold text-blue-900">$${Number(prop.asking_price).toLocaleString()}</span>
                            <a href="#contact" onclick="trackPageImpression(${prop.id})" class="bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-blue-800 transition">Inquire</a>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    if (!err2 && pastList) {
        const pastContainer = document.getElementById("past-properties");
        pastContainer.innerHTML = '';
        pastList.forEach(prop => {
            const badgeColor = prop.status === 'SOLD' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
            pastContainer.innerHTML += `
                <div class="bg-gray-100 border border-gray-200 rounded p-4 relative opacity-85">
                    <span class="absolute top-2 right-2 text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded ${badgeColor}">${prop.status}</span>
                    <h4 class="font-bold text-gray-800 text-sm mt-2 truncate">${prop.resort_name}</h4>
                    <p class="text-xs text-gray-600 font-medium">$${Number(prop.asking_price).toLocaleString()}</p>
                </div>
            `;
        });
    }
}

async function trackPageImpression(propertyId) {
    if (supabaseClientInstance) {
        await supabaseClientInstance.rpc('increment_view_counter', { row_id: propertyId });
    }
}

// ====== CLIENT PORTAL CORE AUTHENTICATION ENGINE ======
function setupPortalAuthentication() {
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("auth-email").value.trim();
        const inputPassword = document.getElementById("auth-password").value.trim();
        const errorMsg = document.getElementById("login-error");

        if (errorMsg) errorMsg.classList.add("hidden");

        let { data: users, error } = await supabaseClientInstance
            .from('clients')
            .select('*')
            .eq('email', email)
            .eq('visible_password', inputPassword);

        if (error || !users || users.length === 0) {
            if (errorMsg) errorMsg.classList.remove("hidden");
            return;
        }

        const clientAccount = users[0]; 
        
        let { data: properties } = await supabaseClientInstance
            .from('properties')
            .select('*')
            .eq('owner_id', clientAccount.id);

        document.getElementById("login-card").classList.add("hidden");
        document.getElementById("portal-dashboard").classList.remove("hidden");
        document.getElementById("owner-title").innerText = `Welcome back, ${clientAccount.client_name}`;

        if (properties && properties.length > 0) {
            const myProp = properties[0];
            
            const finalMetricViews = myProp.manual_views_override !== null 
                ? myProp.manual_views_override 
                : myProp.auto_views_count;

            document.getElementById("metric-views").innerText = finalMetricViews.toLocaleString();
            document.getElementById("detail-resort").innerText = myProp.resort_name;
            document.getElementById("detail-price").innerText = `$${Number(myProp.asking_price).toLocaleString()}`;
            document.getElementById("detail-week").innerText = `Week ${myProp.week_number}`;
            document.getElementById("detail-type").innerText = myProp.listing_type;

            loadPropertyOffers(myProp.id);
        }
    });
}

// ====== OFFERS DATA RENDERING GRID UTILITIES ======
async function loadPropertyOffers(propertyId) {
    let { data: offersList } = await supabaseClientInstance
        .from('offers')
        .select('*')
        .eq('property_id', propertyId)
        .order('date_received', { ascending: false });

    const ledgerBody = document.getElementById("offers-ledger-body");
    if (!ledgerBody) return;
    
    if (offersList && offersList.length > 0) {
        ledgerBody.innerHTML = '';
        offersList.forEach(off => {
            const dateStr = new Date(off.date_received).toLocaleDateString();
            let badgeClass = 'bg-yellow-100 text-yellow-800';
            if (off.status === 'ACCEPTED') badgeClass = 'bg-green-100 text-green-800';
            if (off.status === 'DECLINED') badgeClass = 'bg-red-100 text-red-800';

            ledgerBody.innerHTML += `
                <tr class="hover:bg-gray-50 transition">
                    <td class="p-3 text-gray-600 font-medium">${dateStr}</td>
                    <td class="p-3"><span class="text-xs uppercase font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded">${off.offer_type}</span></td>
                    <td class="p-3 font-bold text-gray-900">$${Number(off.offer_amount).toLocaleString()}</td>
                    <td class="p-3 text-center"><span class="text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}">${off.status}</span></td>
                </tr>
            `;
        });
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
