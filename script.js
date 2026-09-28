// ====== 1. CONFIGURACIÓN Y CREDENCIALES REALES ======
const SUPABASE_URL = "https://supabase.co"; // URL real de tu proyecto
const SUPABASE_ANON_KEY = "sb_publishable_cYSA9_lak5EnHx-b9Q4SQg_6Z-o0h7f"; // Tu llave pública

// ====== 2. INICIALIZACIÓN MÁSTER DEL CONECTOR ======
// Forzamos al navegador a crear el cliente usando tus servidores reales
const supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ====== 3. FUNCIÓN AUXILIAR: BUSCADOR ASÍNCRONO EN LA API DE WIKIPEDIA ======
async function getWikipediaImage(resortName) {
    if (!resortName) return null;
    try {
        // Limpiamos el nombre quitando caracteres extraños para optimizar la búsqueda
        const cleanQuery = encodeURIComponent(resortName.trim());
        
        // Consultamos la API oficial de Wikipedia (formato JSON, buscando la imagen principal)
        const response = await fetch(`https://wikipedia.org{cleanQuery}&prop=pageimages&format=json&pithumbsize=800&origin=*`);
        const data = await response.json();
        
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        // Si Wikipedia tiene una página válida con miniatura, devolvemos el enlace directo
        if (pageId && pages[pageId].thumbnail) {
            return pages[pageId].thumbnail.source;
        }
    } catch (err) {
        console.warn("Wikipedia Image Lookup skipped for:", resortName);
    }
    return null; // Si no hay foto, retorna nulo para usar el respaldo
}

// ====== 4. FUNCIÓN MAESTRA DE CONSULTA Y RENDERIZADO ======
async function fetchAndRenderProperties() {
    const container = document.getElementById("active-properties");
    if (!container) return;

    try {
        // Consulta directa masiva a la tabla de Supabase
        const { data: properties, error } = await supabaseClientInstance
            .from('properties')
            .select('*');

        if (error) throw error;

        if (!properties || properties.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 font-medium">No active properties available at the moment.</div>`;
            return;
        }

        container.innerHTML = "";

        // Procesamos los resorts uno por uno de forma secuencial para resolver las imágenes
        for (const [index, item] of properties.entries()) {
            
            // Intenta buscar la foto en Wikipedia usando el nombre del resort
            let wikiImg = await getWikipediaImage(item.resort_name);
            
            // Sistema de respaldos jerárquico impecable
            let finalImageUrl = "";
            if (wikiImg) {
                finalImageUrl = wikiImg; // Prioridad 1: Foto real de Wikipedia
            } else if (item.image_url && String(item.image_url).startsWith('http')) {
                finalImageUrl = item.image_url; // Prioridad 2: Enlace manual de Supabase si existe
            } else {
                // Prioridad 3: Fondo corporativo elegante de respaldo si no hay fotos disponibles
                finalImageUrl = "https://unsplash.com";
            }

            const isSale = item.listing_type === 'SALE';
            const badgeBg = isSale ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-cyan-50 text-cyan-800 border-cyan-200';

            // Marcador comercial predictivo según el valor económico
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
                            <!-- Imagen inteligente jalada desde la API -->
                            <img src="${finalImageUrl}" alt="${item.resort_name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
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
        }

    } catch (err) {
        console.error("Error sincronizando catálogo:", err);
    }
}

// Inicialización automática del DOM
document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderProperties();
});
