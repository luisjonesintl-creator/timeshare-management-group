// ====== CONFIGURATION STEP ======
const SUPABASE_URL = "https://ztojbyfbyidzzrqicjvn.supabase.co";

// Clave nueva directa sin intermediarios para evitar fallos de lectura local
const SUPABASE_ANON_KEY = "sb_publishable_cYSA9_lak5EnHx-b9Q4SQg_6Z-o0h7f";

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

// Inicializador inteligente para acoplar la lógica según el HTML activo
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const client = getSupabaseClient();
        if (!client) {
            console.error("Critical connection failure: Supabase engine not initialized.");
            return;
        }
        
        // Ejecución si el usuario se encuentra en index.html
        if (document.getElementById("active-properties")) {
            loadPublicMarketplace(client);
            setupLeadSubmission(client);
        }
        
        // Ejecución si el usuario se encuentra en portal.html
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
            if (!activeList || activeList.length === 0) {
                activeContainer.innerHTML = 
                    '<div class="col-span-1 md:col-span-3 p-8 bg-blue-50/50 border border-blue-200/50 rounded-2xl text-center backdrop-blur-sm">' +
                        '<p class="text-blue-950 font-bold text-sm">No active luxury assets listed for sale right now.</p>' +
                        '<p class="text-blue-600 text-xs mt-1 font-medium">Please contact a licensed broker below.</p>' +
                    '</div>';
            } else {
                const activeHTML = activeList.map((prop, index) => {
                    const photos = [];
                    if (prop.image_url) photos.push(prop.image_url);
                    for (let i = 1; i <= 10; i++) {
                        if (prop['image_url' + i]) {
                            photos.push(prop['image_url' + i]);
                        }
                    }

                    let imageHeader = "";
                    if (photos.length === 0) {
                        imageHeader = 
                            '<div class="h-56 w-full bg-gradient-to-tr from-slate-900 via-blue-950 to-cyan-900 flex items-center justify-center relative rounded-t-2xl">' +
                                '<span class="text-white/40 text-[10px] font-black tracking-widest uppercase">TMG Luxury Portfolio</span>' +
                            '</div>';
                    } else {
                        const slidesHTML = photos.map((url, imgIdx) => 
                            '<div id="slide-' + index + '-' + imgIdx + '" class="w-full h-full flex-shrink-0 snap-start relative">' +
                                '<img src="' + url + '" alt="' + (prop.resort_name || 'Resort') + '" class="h-full w-full object-cover">' +
                            '</div>'
                        ).join('');

                        imageHeader = 
                            '<div class="h-56 w-full relative overflow-hidden group/gallery rounded-t-2xl bg-slate-100">' +
                                '<div id="carousel-' + index + '" class="flex w-full h-full overflow-x-hidden snap-x snap-mandatory scroll-smooth no-scrollbar">' +
                                    slidesHTML +
                                '</div>' +
                                '<div class="absolute bottom-3 right-3 bg-slate-950/70 backdrop-blur-md text-white font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider z-20 shadow-sm border border-white/10">' +
                                    '<span id="counter-' + index + '">1</span> / ' + photos.length +
                                '</div>' +
                                (photos.length > 1 ? 
                                    '<button onclick="navigateCarousel(' + index + ', -1, ' + photos.length + ')" class="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 rounded-full p-2 shadow-md hover:scale-105 transition-all z-20 opacity-0 group-hover/gallery:opacity-100 duration-300">' +
                                        '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>' +
                                    '</button>' +
                                    '<button onclick="navigateCarousel(' + index + ', 1, ' + photos.length + ')" class="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-900 rounded-full p-2 shadow-md hover:scale-105 transition-all z-20 opacity-0 group-hover/gallery:opacity-100 duration-300">' +
                                        '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>' +
                                    '</button>' : '') +
                            '</div>';
                    }

                    return `
                        <div class="group bg-white rounded-2xl shadow-md border border-slate-200/60 overflow-hidden hover:shadow-xl hover:border-cyan-500/20 transition-all duration-300 flex flex-col justify-between">
                            <div class="overflow-hidden relative">
                                ${imageHeader}
                                <div class="p-6">
                                    <span class="inline-block text-[9px] font-black uppercase tracking-widest bg-cyan-50 text-cyan-700 border border-cyan-200/40 px-2.5 py-1 rounded-md mb-3">${prop.listing_type || 'N/A'}</span>
                                    <h3 class="text-lg font-black text-slate-900 tracking-tight leading-snug group-hover:text-cyan-600 transition-colors">${prop.resort_name || 'Unknown Resort'}</h3>
                                    <p class="text-slate-400 text-xs font-semibold mt-1 flex items-center">
                                        <svg class="h-3.5 w-3.5 mr-1 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                        Assigned Interval: Week ${prop.week_number || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div class="p-6 pt-0">
                                <div class="flex justify-between items-center pt-4 border-t border-slate-100">
                                    <span class="text-2xl font-black text-blue-950 tracking-tight">$${Number(prop.asking_price || 0).toLocaleString()}</span>
                                    <button data-id="${prop.id}" class="inquire-btn bg-gradient-to-r from-blue-900 to-blue-950 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-sm shadow-blue-950/10">Inquire</button>
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
    } catch (error) {
        console.error("Critical failure rendering active marketplace:", error);
    }
}
// ====== FRONTEND LEAD SUBMISSION UTILITIES ======
function setupLeadSubmission(client) {
    const form = document.getElementById("general-lead-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById("lead-name");
        const emailInput = document.getElementById("lead-email");
        const messageInput = document.getElementById("lead-message");
        const submitBtn = form.querySelector("button[type='submit']");

        if (!nameInput || !emailInput || !messageInput) return;

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = "Sending Request...";
            }

            // Inserción segura de prospectos en la tabla 'leads'
            const { error } = await client.from('leads').insert([
                {
                    full_name: nameInput.value.trim(),
                    email_address: emailInput.value.trim(),
                    inquiry_details: messageInput.value.trim(),
                    created_at: new Date().toISOString()
                }
            ]);

            if (error) throw error;

            form.innerHTML = `
                <div class="p-6 bg-emerald-50 border border-emerald-200 text-center rounded-2xl">
                    <p class="text-emerald-900 font-bold text-base">Thank you, ${nameInput.value.trim()}!</p>
                    <p class="text-emerald-700 text-xs mt-1">Your broker request has been logged through escrow protection. An agent will contact you shortly.</p>
                </div>
            `;

        } catch (err) {
            console.error("Failed to submit broker lead:", err);
            alert("We encountered an error processing your request. Please try again.");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "Submit Broker Request";
            }
        }
    });
}

// ====== PRIVATE PROPRIETARY PORTAL UTILITIES ======
function setupPortalAuthentication(client) {
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById("auth-email");
        const passwordInput = document.getElementById("auth-password");
        const errorAlert = document.getElementById("login-error");
        const loginCard = document.getElementById("login-card");
        const dashboard = document.getElementById("portal-dashboard");

        if (!emailInput || !passwordInput || !loginCard || !dashboard) return;

        try {
            if (errorAlert) errorAlert.classList.add("hidden");

            // Inicio de sesión oficial con el módulo de Auth de Supabase
            const { data, error } = await client.auth.signInWithPassword({
                email: emailInput.value.trim(),
                password: passwordInput.value
            });

            if (error) throw error;

            loginCard.classList.add("hidden");
            dashboard.classList.remove("hidden");

            if (data.user) {
                loadOwnerAssetDashboard(client, data.user.id);
            }

        } catch (err) {
            console.error("Authentication rejected:", err);
            if (errorAlert) errorAlert.classList.remove("hidden");
        }
    });
}

// Carga las métricas y la tabla de ofertas vinculadas al ID del usuario autenticado
async function loadOwnerAssetDashboard(client, userId) {
    try {
        const { data: properties, error: propErr } = await client
            .from('properties')
            .select('*')
            .eq('owner_id', userId)
            .single();

        if (propErr) throw propErr;

        if (properties) {
            document.getElementById("detail-resort").innerText = properties.resort_name || "Premium Resort Asset";
            document.getElementById("detail-price").innerText = properties.asking_price ? `$${Number(properties.asking_price).toLocaleString()}` : "N/A";
            document.getElementById("detail-week").innerText = properties.week_number ? `Week ${properties.week_number}` : "N/A";
            document.getElementById("detail-type").innerText = properties.listing_type || "N/A";
            document.getElementById("metric-views").innerText = properties.views_count ? Number(properties.views_count).toLocaleString() : "0";

            const { data: offers, error: offErr } = await client
                .from('offers')
                .select('*')
                .eq('property_id', properties.id)
                .order('created_at', { ascending: false });

            if (offErr) throw offErr;

            const offersBody = document.getElementById("offers-ledger-body");
            if (offersBody) {
                if (!offers || offers.length === 0) {
                    offersBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400 bg-gray-50/50">No offers recorded for this interval yet.</td></tr>`;
                    return;
                }

                offersBody.innerHTML = offers.map(off => {
                    const dateFormatted = off.created_at ? new Date(off.created_at).toLocaleDateString() : 'N/A';
                    return `
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="p-4 font-medium text-gray-900">${dateFormatted}</td>
                            <td class="p-4">${off.offer_type || 'Purchase Offer'}</td>
                            <td class="p-4 font-extrabold text-blue-950">$${Number(off.amount || 0).toLocaleString()}</td>
                            <td class="p-4 text-center">
                                <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    off.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' :
                                    off.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                                    'bg-amber-50 text-amber-700 border border-amber-200'
                                }">${off.status || 'PENDING'}</span>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        console.error("Error retrieving owner metrics data:", err);
    }
}

// ====== INTERACTIVE CAROUSEL CONTROLLER ======
function navigateCarousel(carouselIdx, direction, totalPhotos) {
    const carousel = document.getElementById(`carousel-${carouselIdx}`);
    const counter = document.getElementById(`counter-${carouselIdx}`);
    if (!carousel || !counter) return;

    const width = carousel.offsetWidth;
    let currentIdx = Math.round(carousel.scrollLeft / width);

    currentIdx += direction;

    if (currentIdx < 0) currentIdx = totalPhotos - 1;
    if (currentIdx >= totalPhotos) currentIdx = 0;

    carousel.scrollTo({
        left: currentIdx * width,
        behavior: 'smooth'
    });

    counter.textContent = currentIdx + 1;
}
