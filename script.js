// =========================================================================
// TIMESHARE MANAGEMENT GROUP — MASTER ENGINE WITH REAL-TIME SEARCH (V8.0)
// =========================================================================

// ====== 1. CONFIGURACIÓN Y CREDENCIALES REALES ======
const SUPABASE_URL = "https://ztojbyfbyidzzrqicjvn.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_cYSA9_lak5EnHx-b9Q4SQg_6Z-o0h7f"; 

// ====== 2. INICIALIZACIÓN MÁSTER DEL CONECTOR ======
const supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Memoria caché local para almacenar los resorts y permitir búsquedas instantáneas
let localPropertiesCache = [];

// ====== 3. FUNCIÓN DE RENDERIZADO VISUAL ======
function renderPropertiesGrid(propertiesList) {
    const container = document.getElementById("active-properties");
    if (!container) return;

    if (!propertiesList || propertiesList.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <svg class="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p class="text-slate-400 text-sm font-medium">No resorts match your search criteria.</p>
            </div>`;
        return;
    }

    container.innerHTML = "";

    propertiesList.forEach((item) => {
        let finalImageUrl = "";
        if (item.image_url && String(item.image_url).trim().startsWith('http')) {
            finalImageUrl = String(item.image_url).trim();
        } else {
            finalImageUrl = "https://unsplash.com";
        }

        const isSale = item.listing_type === 'SALE';
        const badgeBg = isSale ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-cyan-50 text-cyan-800 border-cyan-200';

        let dealBadge = '<span class="bg-blue-50 text-blue-700 border border-blue-200/50 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 inline-block">Verified Ownership</span>';
        const price = Number(item.asking_price || 0);
        if (price < 8000) {
            dealBadge = '<span class="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 inline-block">Best Value Deal</span>';
        } else if (price > 16000) {
            dealBadge = '<span class="bg-amber-50 text-amber-700 border border-amber-200/50 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 inline-block">High Demand Asset</span>';
        }

        const cardHtml = `
            <div class="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div>
                    <div class="relative h-48 w-full overflow-hidden bg-slate-900">
                        <img src="${finalImageUrl}" alt="${item.resort_name || 'Resort'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <span class="absolute top-4 left-4 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border backdrop-blur-md z-10 ${badgeBg}">
                            For ${item.listing_type || 'SALE'}
                        </span>
                        <span class="absolute top-4 right-4 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm z-10">
                            Week ${item.week_number || 'N/A'}
                        </span>
                    </div>
                    <div class="p-6 space-y-2">
                        <div class="flex justify-between items-center">
                            ${dealBadge}
                            <span class="text-slate-400 font-bold text-[10px]">ID #TMG${item.id}</span>
                        </div>
                        <h4 class="text-base font-black text-slate-900 tracking-tight leading-snug line-clamp-2 min-h-[3rem]">
                            ${item.resort_name || 'Premium Vacation Resort'}
                        </h4>
                    </div>
                </div>
                <div class="p-6 pt-0">
                    <div class="pt-5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <span class="block text-[9px] uppercase tracking-widest font-bold text-slate-400">Asking Price</span>
                            <span class="text-xl font-black text-slate-900">$${price.toLocaleString()}</span>
                        </div>
                        <button onclick="document.getElementById('contact').scrollIntoView({behavior:'smooth'})" class="bg-blue-900 hover:bg-blue-950 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-sm">
                            Make Offer
                        </button>
                    </div>
                </div>
            </div>`;
        container.innerHTML += cardHtml;
    });
}


// ====== 4. FUNCIÓN MAESTRA DE CONSULTA E INICIALIZACIÓN DE CACHÉ ======
async function fetchAndRenderProperties() {
    try {
        // Consulta directa masiva a la tabla de Supabase sin filtros restrictivos
        const { data: properties, error } = await supabaseClientInstance
            .from('properties')
            .select('*');

        if (error) throw error;

        // Guardamos los datos originales en nuestra memoria caché local
        localPropertiesCache = properties || [];

        // Renderizamos la grilla inicial completa con todos los resorts
        renderPropertiesGrid(localPropertiesCache);

    } catch (err) {
        console.error("Error sincronizando catálogo principal:", err);
        const container = document.getElementById("active-properties");
        if (container) {
            container.innerHTML = `<div class="col-span-full text-center py-12 text-rose-500 font-bold uppercase tracking-wider">Database Connection Error. Please Refresh.</div>`;
        }
    }
}

// ====== 5. ESCUCHADOR ACTIVO (EVENT LISTENER) DEL BUSCADOR PREDICTIVO ======
document.addEventListener("DOMContentLoaded", async () => {
    // Primero, disparamos la carga inicial masiva desde Supabase
    await fetchAndRenderProperties();

    // Localizamos la barra de búsqueda en el HTML por su ID vinculado
    const searchInput = document.getElementById("search-input");
    
    if (searchInput) {
        // Escuchamos en tiempo real cada tecla presionada por el usuario (evento input)
        searchInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();

            // Si la barra está vacía, volvemos a mostrar todo el catálogo guardado en caché
            if (searchTerm === "") {
                renderPropertiesGrid(localPropertiesCache);
                return;
            }

            // Filtramos en caliente de forma instantánea sobre los datos en memoria
            const filteredResults = localPropertiesCache.filter(item => {
                const resortName = item.resort_name ? item.resort_name.toLowerCase() : "";
                return resortName.includes(searchTerm);
            });

            // Dibujamos los resultados coincidentes de forma fluida y sin refrescar
            renderPropertiesGrid(filteredResults);
        });
    }
});
