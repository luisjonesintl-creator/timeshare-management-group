// =========================================================================
// TIMESHARE MANAGEMENT GROUP — MASTER CORE ENGINE (PRODUCTION V2.5)
// =========================================================================

// ====== 1. CONFIGURACIÓN Y CREDENCIALES GLOBALES ======
const SUPABASE_URL = "https://unpkg.com/@supabase/supabase-js@2";
const SUPABASE_ANON_KEY = "sb_publishable_cYSA9_lak5EnHx-b9Q4SQg_6Z-o0h7f";

let supabaseClientInstance = null;
let globalActiveListings = []; // Memoria caché local para el motor de búsqueda en tiempo real

// ====== 2. INICIALIZACIÓN DEL MOTOR DE BASE DE DATOS ======
function getSupabaseClient() {
    if (!supabaseClientInstance) {
        const creator = window.supabase?.createClient || window.createClient || (typeof createClient !== 'undefined' ? createClient : null);
        if (creator) {
            supabaseClientInstance = creator(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    }
    return supabaseClientInstance;
}

// ====== 3. ENRUTADOR INTELIGENTE DE CICLO DE VIDA ======
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(async () => {
        const client = getSupabaseClient();
        if (!client) {
            console.error("Critical core failure: Supabase engine could not be initialized.");
            return;
        }

        // Control de entorno seguro para la página admin.html
        if (document.getElementById("admin-add-form")) {
            console.log("Admin environment successfully routed.");
            return; 
        }

        // Enrutamiento estándar de interfaces públicas y portal de usuario
        if (document.getElementById("active-properties")) {
            initPublicMarketplace(client);
            setupLeadSubmission(client);
        }
        if (document.getElementById("login-form")) {
            setupPortalAuthentication(client);
        }
    }, 300);
});

// ====== 4. CATÁLOGO PÚBLICO INTEGRADO ======
async function initPublicMarketplace(client) {
    try {
        const { data: activeList, error: err } = await client
            .from('properties')
            .select('*')
            .eq('status', 'AVAILABLE')
            .order('created_at', { ascending: false });

        if (err) throw err;

        globalActiveListings = activeList || [];
        renderCatalogCards(globalActiveListings);
        setupLiveSearchEngine();

    } catch (error) {
        console.error("Critical failure during catalog synchronization:", error);
    }
}
// ====== 5. RENDERIZADOR MAESTRO DE TARJETAS DEL PORTAFOLIO ======
function renderCatalogCards(listings) {
    const container = document.getElementById("active-properties");
    if (!container) return;

    if (listings.length === 0) {
        container.innerHTML = 
            '<div class="col-span-1 md:col-span-3 p-12 bg-blue-50/50 border border-blue-200/50 rounded-3xl text-center backdrop-blur-sm">' +
                '<p class="text-blue-950 font-bold text-sm">No match found for your search query.</p>' +
                '<p class="text-slate-400 text-xs mt-1 font-medium">Try clearing your keywords or contact a broker below.</p>' +
            '</div>';
        return;
    }

    container.innerHTML = listings.map((prop, index) => {
        // Recopilación de imágenes adicionales guardadas en Supabase
        const photos = [];
        if (prop.image_url) photos.push(prop.image_url);
        for (let i = 1; i <= 10; i++) {
            if (prop['image_url' + i]) photos.push(prop['image_url' + i]);
        }

        // Asignador predictivo de etiquetas según el precio real de mercado
        let dealBadge = '<span class="bg-blue-50 text-blue-700 border border-blue-200/50 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 inline-block">Verified Ownership</span>';
        const price = Number(prop.asking_price || 0);
        if (price < 8000) {
            dealBadge = '<span class="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 inline-block">Best Value Deal</span>';
        } else if (price > 16000) {
            dealBadge = '<span class="bg-amber-50 text-amber-700 border border-amber-200/50 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 inline-block">High Demand Asset</span>';
        }

        let imageHeader = "";
        if (photos.length === 0) {
            imageHeader = 
                '<div class="h-56 w-full bg-gradient-to-tr from-slate-900 via-blue-950 to-cyan-900 flex items-center justify-center relative rounded-t-2xl">' +
                    '<span class="text-white/40 text-[10px] font-black tracking-widest uppercase">TMG Luxury Portfolio</span>' +
                '</div>';
        } else {
            // Mapeo seguro de diapositivas horizontales con object-contain nativo
            const slidesHTML = photos.map((url, imgIdx) => 
                '<div id="slide-' + index + '-' + imgIdx + '" class="w-full h-full flex-shrink-0 snap-start relative bg-slate-950 flex items-center justify-center">' +
                    '<img src="' + url + '" alt="' + (prop.resort_name || 'Resort') + '" class="max-h-full max-w-full object-contain transition-all duration-500">' +
                '</div>'
            ).join('');

            imageHeader = 
                '<div class="h-56 w-full relative overflow-hidden group/gallery rounded-t-2xl bg-slate-100 shadow-inner">' +
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
        // Concatenación HTML blindada sin comillas invertidas conflictivas
        return (
            '<div class="group bg-white rounded-2xl shadow-md border border-slate-200/60 overflow-hidden hover:shadow-xl hover:border-cyan-500/20 transition-all duration-300 flex flex-col justify-between">' +
                '<div class="overflow-hidden relative">' +
                    imageHeader +
                    '<div class="p-6">' +
                        '<div class="flex justify-between items-start">' +
                            dealBadge +
                            '<span class="text-slate-400 font-bold text-[10px]">AD #TMG' + prop.id + '</span>' +
                        '</div>' +
                        '<h3 class="text-base font-black text-slate-900 tracking-tight leading-snug group-hover:text-blue-900 transition-colors duration-300">' + (prop.resort_name || 'Unknown Resort') + '</h3>' +
                        '<p class="text-slate-400 text-xs font-semibold mt-2 flex items-center">' +
                            '<svg class="h-3.5 w-3.5 mr-1 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' +
                            'Assigned Schedule: Week ' + (prop.week_number || 'N/A') +
                        '</p>' +
                    '</div>' +
                '</div>' +
                '<div class="p-6 pt-0">' +
                    '<div class="flex justify-between items-center pt-4 border-t border-slate-100">' +
                        '<div class="flex flex-col">' +
                            '<span class="text-[9px] uppercase tracking-widest font-black text-slate-400 leading-none">' + (prop.listing_type || 'SALE') + '</span>' +
                            '<span class="text-xl font-black text-blue-950 tracking-tight mt-0.5">$' + price.toLocaleString() + '</span>' +
                        '</div>' +
                        '<button data-id="' + prop.id + '" class="inquire-btn bg-gradient-to-r from-blue-900 to-blue-950 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-sm">Inquire</button>' +
                    </div>' +
                '</div>' +
            '</div>'
        );
    }).join('');

    // Vinculamos el scroll suave en caliente hacia el formulario de captación
    container.querySelectorAll('.inquire-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const contactSection = document.getElementById("contact");
            if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// ====== 6. MOTOR DE BÚSQUEDA PREDICTIVO EN TIEMPO REAL (LIVE SEARCH) ======
function setupLiveSearchEngine() {
    const searchInput = document.querySelector("input[placeholder*='Search resorts']");
    if (!searchInput) return;

    searchInput.removeAttribute("disabled");
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        const filtered = globalActiveListings.filter(prop => 
            (prop.resort_name && prop.resort_name.toLowerCase().includes(query)) ||
            (prop.listing_type && prop.listing_type.toLowerCase().includes(query))
        );
        
        renderCatalogCards(filtered);
    });
}
// ====== 7. CAPTACIÓN ASÍNCRONA DE PROSPECTOS PÚBLICOS (LEADS) ======
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

            const { error } = await client.from('leads').insert([
                {
                    full_name: nameInput.value.trim(),
                    email_address: emailInput.value.trim(),
                    inquiry_details: messageInput.value.trim(),
                    created_at: new Date().toISOString()
                }
            ]);

            if (error) throw error;

            form.innerHTML = 
                '<div class="p-6 bg-emerald-50 border border-emerald-200 text-center rounded-2xl">' +
                    '<p class="text-emerald-900 font-bold text-base">Thank you, ' + nameInput.value.trim() + '!</p>' +
                    '<p class="text-emerald-700 text-xs mt-1">Your broker request has been logged successfully.</p>' +
                '</div>';

        } catch (err) {
            console.error("Failed to submit broker lead:", err);
            alert("We encountered an error processing your request.");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "Submit Broker Request";
            }
        }
    });
}

// ====== 8. AUTENTICACIÓN Y CONSULTA DE PROPIETARIOS (PORTAL USER) ======
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

async function loadOwnerAssetDashboard(client, userId) {
    try {
        const { data: ownerAsset, error: propErr } = await client
            .from('Owners')
            .select('*')
            .eq('owner_id', userId)
            .single();

        if (propErr) throw propErr;

        if (ownerAsset) {
            document.getElementById("detail-resort").innerText = ownerAsset.resort_name || "Premium Resort Asset";
            document.getElementById("detail-price").innerText = ownerAsset.asking_price ? "$" + Number(ownerAsset.asking_price).toLocaleString() : "N/A";
            document.getElementById("detail-week").innerText = ownerAsset.week_number ? "Week " + ownerAsset.week_number : "N/A";
            document.getElementById("detail-type").innerText = ownerAsset.listing_type || "N/A";
            document.getElementById("metric-views").innerText = ownerAsset.views_count ? Number(ownerAsset.views_count).toLocaleString() : "0";

            const { data: offers, error: offErr } = await client
                .from('offers')
                .select('*')
                .eq('property_id', ownerAsset.id)
                .order('created_at', { ascending: false });

            if (offErr) throw offErr;

            const offersBody = document.getElementById("offers-ledger-body");
            if (offersBody) {
                if (!offers || offers.length === 0) {
                    offersBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400 bg-gray-50/50">No offers recorded for this interval yet.</td></tr>';
                    return;
                }

                offersBody.innerHTML = offers.map(off => {
                    const dateFormatted = off.created_at ? new Date(off.created_at).toLocaleDateString() : 'N/A';
                    return (
                        '<tr class="hover:bg-gray-50 transition-colors">' +
                            '<td class="p-4 font-medium text-gray-900">' + dateFormatted + '</td>' +
                            '<td class="p-4">' + (off.offer_type || 'Purchase Offer') + '</td>' +
                            '<td class="p-4 font-extrabold text-blue-950">$' + Number(off.amount || 0).toLocaleString() + '</td>' +
                            '<td class="p-4 text-center">' +
                                '<span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ' +
                                    (off.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' :
                                     off.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                                     'bg-amber-50 text-amber-700 border border-amber-200') +
                                '">' + (off.status || 'PENDING') + '</span>' +
                            '</td>' +
                        '</tr>'
                    );
                }).join('');
            }
        }
    } catch (err) {
        console.error("Error retrieving owner metrics data:", err);
    }
}

// ====== 9. INTERACTIVE CAROUSEL CONTROLLER ======
function navigateCarousel(carouselIdx, direction, totalPhotos) {
    const carousel = document.getElementById("carousel-" + carouselIdx);
    const counter = document.getElementById("counter-" + carouselIdx);
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
// ====== 10. VALIDADOR DE CONTRASEÑA Y OPERACIONES ADMIN ======
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("admin-login-form");
    if (!loginForm) return;

    const MASTER_SECRET_TOKEN = "TMGAdmin2026";
    const client = typeof getSupabaseClient === 'function' ? getSupabaseClient() : null;

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById("admin-secret-pass");
        const errorAlert = document.getElementById("admin-auth-error");
        const authCard = document.getElementById("admin-auth-card");
        const mainDashboard = document.getElementById("admin-main-dashboard");

        if (passwordInput.value === MASTER_SECRET_TOKEN) {
            if (errorAlert) errorAlert.classList.add("hidden");
            authCard.classList.add("hidden");
            mainDashboard.classList.remove("hidden");
        } else {
            if (errorAlert) errorAlert.classList.remove("hidden");
            passwordInput.value = "";
            passwordInput.focus();
        }
    });

    if (!client) return;

    // --- ACCIÓN: CREAR / ALTA ---
    const addForm = document.getElementById("admin-add-form");
    addForm?.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const submitBtn = addForm.querySelector("button[type='submit']");
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerText = "Deploying...";

            const { error } = await client.from('properties').insert([
                {
                    resort_name: document.getElementById("add-resort-name").value.trim(),
                    asking_price: Number(document.getElementById("add-price").value),
                    week_number: Number(document.getElementById("add-week").value),
                    listing_type: document.getElementById("add-type").value,
                    status: document.getElementById("add-status").value,
                    image_url: document.getElementById("add-image").value.trim(),
                    created_at: new Date().toISOString()
                }
            ]);

            if (error) throw error;
            alert("¡Resort publicado exitosamente!");
            addForm.reset();
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "Publish Asset To Marketplace";
        }
    });

    // --- ACCIÓN: EDITAR / MODIFICAR ---
    const updateBtn = document.getElementById("admin-update-btn");
    updateBtn?.addEventListener("click", async () => {
        const idVal = document.getElementById("admin-edit-id").value;
        const nameVal = document.getElementById("admin-edit-name").value.trim();
        const priceVal = document.getElementById("admin-edit-price").value;
        const weekVal = document.getElementById("admin-edit-week").value;

        if (!idVal) {
            alert("Introduce el ID numérico.");
            return;
        }

        try {
            updateBtn.disabled = true;
            const updateData = { created_at: new Date().toISOString() };
            if (nameVal) updateData.resort_name = nameVal;
            if (priceVal) updateData.asking_price = Number(priceVal);
            if (weekVal) updateData.week_number = Number(weekVal);

            const { error } = await client.from('properties').update(updateData).eq('id', Number(idVal));
            if (error) throw error;
            alert("¡Registro ID #" + idVal + " modificado con éxito!");
            
            document.getElementById("admin-edit-id").value = "";
            document.getElementById("admin-edit-name").value = "";
            document.getElementById("admin-edit-price").value = "";
            document.getElementById("admin-edit-week").value = "";
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            updateBtn.disabled = false;
            updateBtn.innerText = "Save Changes via UI";
        }
    });
    // --- ACCIÓN: CLONAR / DUPLICAR ---
    const cloneBtn = document.getElementById("admin-clone-btn");
    cloneBtn?.addEventListener("click", async () => {
        const sourceId = document.getElementById("admin-clone-source-id").value;
        if (!sourceId) {
            alert("Introduce el ID base.");
            return;
        }

        try {
            cloneBtn.disabled = true;
            const { data: src, error: fetchErr } = await client.from('properties').select('*').eq('id', Number(sourceId)).single();
            if (fetchErr) throw fetchErr;

            const { error: insErr } = await client.from('properties').insert([
                {
                    resort_name: src.resort_name,
                    asking_price: src.asking_price,
                    week_number: src.week_number,
                    listing_type: src.listing_type,
                    status: src.status,
                    image_url: src.image_url,
                    created_at: new Date().toISOString()
                }
            ]);

            if (insErr) throw insErr;
            alert("¡Listado clonado y desplegado exitosamente!");
            document.getElementById("admin-clone-source-id").value = "";
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            cloneBtn.disabled = false;
            cloneBtn.innerText = "Clone & Deploy Duplicate Listing";
        }
    });

    // --- ACCIÓN: ELIMINAR ---
    const deleteBtn = document.getElementById("admin-delete-btn");
    deleteBtn?.addEventListener("click", async () => {
        const deleteId = document.getElementById("admin-delete-id").value;
        if (!deleteId) return;

        if (!confirm("¿Eliminar permanentemente este registro?")) return;

        try {
            deleteBtn.disabled = true;
            const { error } = await client.from('properties').delete().eq('id', Number(deleteId));
            if (error) throw error;
            alert("¡Registro ID #" + deleteId + " borrado definitivamente!");
            document.getElementById("admin-delete-id").value = "";
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            deleteBtn.disabled = false;
            deleteBtn.innerText = "Permanently Wipe Record";
        }
    });
});
