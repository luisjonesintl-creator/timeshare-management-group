// ====== CONFIGURATION STEP ======
const SUPABASE_URL = "https://unpkg.com/@supabase/supabase-js@2";
const SUPABASE_ANON_KEY = "sb_publishable_cYSA9_lak5EnHx-b9Q4SQg_6Z-o0h7f";

// ====== INITIALIZATION ROUTINE ======
const supabaseClientInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchAndRenderProperties() {
    const container = document.getElementById("active-properties");
    if (!container) return;

    try {
        const { data: properties, error } = await supabaseClientInstance
            .from('properties')
            .select('*')
            .eq('status', 'AVAILABLE');

        if (error) throw error;

        if (!properties || properties.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 font-medium">No active properties available.</div>`;
            return;
        }

        container.innerHTML = "";

        properties.forEach((item) => {
            // Recopilamos las imágenes cargadas en tu base de datos
            const photos = [];
            if (item.image_url) photos.push(String(item.image_url).trim());
            for (let i = 1; i <= 3; i++) {
                if (item['image_url' + i]) photos.push(String(item['image_url' + i]).trim());
            }

            // Imagen por defecto si el registro viene vacío
            const mainImg = photos[0] || "https://supabase.co/storage/v1/object/public/resorts/SamplePlaceHolders/ygunyunjuhmgnjmh.JPG";

            // Generador dinámico de miniaturas inferiores (método nativo sin librerías externas)
            const thumbnailsHtml = photos.slice(1).map(url => `
                <img src="${url}" class="h-10 w-12 object-cover rounded-md border border-slate-200 cursor-pointer hover:border-blue-900 transition" onclick="this.closest('.group').querySelector('.main-display').src='${url}'">
            `).join('');

            const isSale = item.listing_type === 'SALE';
            const badgeBg = isSale ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-cyan-50 text-cyan-800 border-cyan-200';

            const cardHtml = `
                <div class="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group p-4">
                    <!-- Visor de Imagen Principal Nativo -->
                    <div class="relative h-48 w-full overflow-hidden bg-slate-100 rounded-2xl flex flex-col justify-between">
                        <img src="${mainImg}" alt="${item.resort_name}" class="main-display w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <span class="absolute top-4 left-4 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border backdrop-blur-md ${badgeBg}">
                            For ${item.listing_type || 'SALE'}
                        </span>
                    </div>

                    <!-- Fila de Miniaturas si existen más fotos -->
                    <div class="flex space-x-2 mt-2 px-1 overflow-x-auto">
                        ${thumbnailsHtml}
                    </div>

                    <!-- Cuerpo informativo -->
                    <div class="pt-4 flex flex-col flex-grow justify-between">
                        <div class="space-y-2">
                            <h4 class="text-base font-black text-slate-900 tracking-tight leading-snug line-clamp-2 min-h-[3rem]">
                                ${item.resort_name || 'Premium Vacation Resort'}
                            </h4>
                        </div>

                        <!-- Precio y botón de oferta -->
                        <div class="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <span class="block text-[9px] uppercase tracking-widest font-bold text-slate-400">Asking Price</span>
                                <span class="text-xl font-black text-slate-900">$${Number(item.asking_price || 0).toLocaleString()}</span>
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

document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderProperties();
});
