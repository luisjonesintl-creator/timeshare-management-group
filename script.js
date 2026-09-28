// =========================================================================
// TIMESHARE MANAGEMENT GROUP — SUPABASE NATIVE IMAGE ENGINE (V7.0)
// =========================================================================

// ====== 1. CONFIGURACIÓN Y CREDENCIALES REALES ======
const SUPABASE_URL = "https://unpkg.com/@supabase/supabase-js@2"; 
const SUPABASE_ANON_KEY = "sb_publishable_cYSA9_lak5EnHx-b9Q4SQg_6Z-o0h7f"; 

// ====== 2. INICIALIZACIÓN MÁSTER DEL CONECTOR ======
const supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====== 3. FUNCIÓN MAESTRA DE CONSULTA Y RENDERIZADO ======
async function fetchAndRenderProperties() {
    const container = document.getElementById("active-properties");
    if (!container) return;

    try {
        // Consulta directa masiva a la tabla de Supabase sin filtros restrictivos
        const { data: properties, error } = await supabaseClientInstance
            .from('properties')
            .select('*');

        if (error) throw error;

        if (!properties || properties.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 font-medium">No active properties available at the moment.</div>`;
            return;
        }

        container.innerHTML = "";

        // Procesamos los resorts uno por uno dibujando sus datos en pantalla
        properties.forEach((item, index) => {
            
            // Evaluamos la URL de la imagen guardada en tu base de datos de Supabase
            let finalImageUrl = "";
            if (item.image_url && String(item.image_url).trim().startsWith('http')) {
                finalImageUrl = String(item.image_url).trim(); // Usa tu foto real de Supabase
            } else {
                // Foto premium de respaldo si la columna en la base de datos está vacía
                finalImageUrl = "https://unsplash.com";
            }

            const isSale = item.listing_type === 'SALE';
            const badgeBg = isSale ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-cyan-50 text-cyan-800 border-cyan-200';

            // Marcador comercial predictivo según el precio
            let dealBadge = '<span class="bg-blue-50 text-blue-700 border border-blue-200/50 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 inline-block">Verified Ownership</span>';
            const price = Number(item.asking_price || 0);
            if (price < 8000) {
                dealBadge = '<span class="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 inline-block">Best Value Deal</span>';
            } else if (price > 16000) {
                dealBadge = '<span class="bg-amber-50 text-amber-700 border border-amber-200/50 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 inline-block">High Demand Asset</span>';
            }

            const cardHtml = `
                <div class="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                    <div>
                        <div class="relative h-48 w-full overflow-hidden bg-slate-900">
                            <!-- Inyección directa de la imagen de Supabase -->
                            <img src="${finalImageUrl}" alt="${item.resort_name || 'Resort'}" class="w-full h-full object-cover">
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
                </div>
            `;
            container.innerHTML += cardHtml;
        });

    } catch (err) {
        console.error("Error sincronizando catálogo:", err);
    }
}

// Inicialización automática cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderProperties();
});
