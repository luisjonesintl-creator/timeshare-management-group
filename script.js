// ====== CONFIGURATION STEP ======
const SUPABASE_URL = "https://ztojbyfbyidzzrqicjvn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cYSA9_lak5EnHx-b9Q4SQg_6Z-o0h7f";

// ====== INITIALIZATION ROUTINE ======
const supabaseClientInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Función asíncrona para consultar la base de datos y pintar el catálogo con método blindado
async function fetchAndRenderProperties() {
    const container = document.getElementById("active-properties");
    if (!container) return;

    try {
        const { data: properties, error } = await supabaseClientInstance
            .from('properties')
            .select('*')
            .eq('status', 'AVAILABLE')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!properties || properties.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-slate-400 font-medium">
                    No active properties available at the moment.
                </div>`;
            return;
        }

        // Limpiamos el indicador de carga
        container.innerHTML = "";

        // Recorremos cada propiedad devuelta por Supabase para renderizar su diseño
        properties.forEach((item, index) => {
            // Recopilamos de forma segura hasta 10 fotos por registro para alimentar el carrusel de Swiper
            const photos = [];
            if (item.image_url) photos.push(String(item.image_url).trim());
            for (let i = 1; i <= 10; i++) {
                if (item['image_url' + i]) photos.push(String(item['image_url' + i]).trim());
            }

            // Construcción del contenedor de fotos (Carrusel dinámico vs Imagen única)
            let imageHeaderHtml = "";
            if (photos.length === 0) {
                imageHeaderHtml = `
                    <div class="h-48 w-full bg-gradient-to-tr from-slate-900 via-blue-950 to-cyan-900 flex items-center justify-center relative">
                        <span class="text-white/40 text-[10px] font-black tracking-widest uppercase">TMG Luxury Portfolio</span>
                    </div>`;
            } else {
                const slidesHtml = photos.map(url => `
                    <div class="swiper-slide bg-slate-950 flex items-center justify-center h-full">
                        <img src="${url}" alt="${item.resort_name}" class="max-h-full max-w-full object-contain">
                    </div>
                `).join('');

                imageHeaderHtml = `
                    <div class="swiper cardSwiper-${index} h-48 w-full relative overflow-hidden bg-slate-100 shadow-inner">
                        <div class="swiper-wrapper h-full">
                            ${slidesHtml}
                        </div>
                        <div class="swiper-pagination swiper-pagination-${index} !text-[10px] !bottom-3"></div>
                        <div class="swiper-button-next swiper-button-next-${index} !text-white !scale-50 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300"></div>
                        <div class="swiper-button-prev swiper-button-prev-${index} !text-white !scale-50 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300"></div>
                    </div>`;
            }
            // Definimos el color de la etiqueta según el tipo de oferta
            const isSale = item.listing_type === 'SALE';
            const badgeBg = isSale ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-cyan-50 text-cyan-800 border-cyan-200';

            // Estructura HTML de la tarjeta inyectando los datos de tu tabla
            const cardHtml = `
                <div class="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group">
                    <!-- Contenedor del Carrusel Moderno -->
                    <div class="relative h-48 w-full overflow-hidden bg-slate-100 group-hover/img">
                        ${imageHeaderHtml}
                        <span class="absolute top-4 left-4 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border backdrop-blur-md z-10 ${badgeBg}">
                            For ${item.listing_type || 'SALE'}
                        </span>
                        <span class="absolute top-4 right-4 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm z-10">
                            Week ${item.week_number || 'N/A'}
                        </span>
                    </div>

                    <!-- Cuerpo informativo -->
                    <div class="p-6 flex flex-col flex-grow justify-between">
                        <div class="space-y-2">
                            <h4 class="text-base font-black text-slate-900 tracking-tight leading-snug line-clamp-2 min-h-[3rem]">
                                ${item.resort_name || 'Premium Vacation Resort'}
                            </h4>
                            <div class="flex items-center space-x-1 text-slate-400">
                                <svg class="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                <span class="text-[11px] font-semibold tracking-wide uppercase tracking-widest text-slate-400">Verified Resort Asset</span>
                            </div>
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
            
            // Adjuntamos la nueva tarjeta dentro de la grilla contenedora
            container.innerHTML += cardHtml;

            // Despertamos el motor Swiper de forma instantánea y aislada para esta propiedad específica
            if (photos.length > 0 && typeof Swiper !== 'undefined') {
                setTimeout(() => {
                    new Swiper(`.cardSwiper-${index}`, {
                        loop: true,
                        pagination: { el: `.swiper-pagination-${index}`, clickable: true },
                        navigation: { nextEl: `.swiper-button-next-${index}`, prevEl: `.swiper-button-prev-${index}` },
                    });
                }, 40);
            }
        });

    } catch (err) {
        console.error("Error sincronizando catálogo:", err);
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-rose-600 font-semibold text-xs uppercase tracking-wider">
                Failed to sync active resale feed. Please try reloading the page.
            </div>`;
    }
}

// Ejecutamos la sincronización de Supabase inmediatamente al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderProperties();
});
