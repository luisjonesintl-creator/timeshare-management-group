// ====== CONFIGURATION STEP ======
const SUPABASE_URL = "https://unpkg.com/@supabase/supabase-js@2";
const SUPABASE_ANON_KEY = "sb_publishable_cYSA9_lak5EnHx-b9Q4SQg_6Z-o0h7f";

// ====== INITIALIZATION ROUTINE ======
const supabaseClientInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Función de control nativa para cambiar las imágenes del carrusel por tarjeta
window.switchNativeSlide = function(cardIndex, direction) {
    const slider = document.getElementById(`native-slider-${cardIndex}`);
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.slide-item');
    let activeIndex = -1;
    
    // Localizamos cuál es la imagen visible actualmente
    slides.forEach((slide, idx) => {
        if (!slide.classList.contains('hidden')) {
            activeIndex = idx;
        }
    });
    
    if (activeIndex === -1) return;
    
    // Calculamos el índice de la siguiente fotografía
    let nextIndex = activeIndex + direction;
    if (nextIndex >= slides.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = slides.length - 1;
    
    // Ocultamos la anterior y mostramos la nueva diapositiva en caliente
    slides[activeIndex].classList.add('hidden');
    slides[nextIndex].classList.remove('hidden');
    
    // Actualizamos el indicador numérico flotante
    const badge = document.getElementById(`slide-badge-${cardIndex}`);
    if (badge) {
        badge.innerText = `${nextIndex + 1} / ${slides.length}`;
    }
};

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
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-slate-400 font-medium">
                    No active properties available at the moment.
                </div>`;
            return;
        }

        container.innerHTML = "";

        properties.forEach((item, index) => {
            // Mapeo dinámico de imágenes
            const photos = [];
            if (item.image_url) photos.push(String(item.image_url).trim());
            for (let i = 1; i <= 5; i++) {
                if (item['image_url' + i]) photos.push(String(item['image_url' + i]).trim());
            }

            let carouselHtml = "";
            if (photos.length === 0) {
                carouselHtml = `
                    <div class="h-48 w-full bg-gradient-to-tr from-slate-900 via-blue-950 to-cyan-900 flex items-center justify-center relative">
                        <span class="text-white/40 text-[10px] font-black tracking-widest uppercase">TMG Luxury Portfolio</span>
                    </div>`;
            } else {
                // Estructuramos las diapositivas de forma nativa ocultando las secundarias
                const slidesHtml = photos.map((url, idx) => `
                    <div class="slide-item w-full h-full relative transition-all duration-300 ${idx === 0 ? '' : 'hidden'}">
                        <img src="${url}" alt="${item.resort_name}" class="w-full h-full object-cover">
                    </div>
                `).join('');

                carouselHtml = `
                    <div class="relative h-48 w-full overflow-hidden bg-slate-900 group/nav" id="native-slider-${index}">
                        <div class="w-full h-full">
                            ${slidesHtml}
                        </div>
                        
                        <!-- Indicador Flotante Numérico -->
                        <span id="slide-badge-${index}" class="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-slate-950/70 text-white font-bold text-[10px] px-2 py-0.5 rounded-full tracking-wider z-10 backdrop-blur-sm">
                            1 / ${photos.length}
                        </span>

                        <!-- Controles de Flechas Nativos basados en Tailwind -->
                        <button type="button" onclick="window.switchNativeSlide(${index}, -1)" class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-slate-950/40 hover:bg-slate-950/80 text-white p-1.5 rounded-full opacity-0 group-hover/nav:opacity-100 transition-opacity z-20 backdrop-blur-sm">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                        </button>
                        <button type="button" onclick="window.switchNativeSlide(${index}, 1)" class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-950/40 hover:bg-slate-950/80 text-white p-1.5 rounded-full opacity-0 group-hover/nav:opacity-100 transition-opacity z-20 backdrop-blur-sm">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </button>
                    </div>`;
            }

            const isSale = item.listing_type === 'SALE';
            const badgeBg = isSale ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-cyan-50 text-cyan-800 border-cyan-200';

            const cardHtml = `
                <div class="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                    <div>
                        <div class="relative">
                            ${carouselHtml}
                            <span class="absolute top-4 left-4 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border backdrop-blur-md z-10 ${badgeBg}">
                                For ${item.listing_type || 'SALE'}
                            </span>
                            <span class="absolute top-4 right-4 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm z-10">
                                Week ${item.week_number || 'N/A'}
                            </span>
                        </div>

                        <div class="p-6 space-y-2">
                            <span class="text-slate-400 font-bold text-[10px] block">ID #TMG${item.id}</span>
                            <h4 class="text-base font-black text-slate-900 tracking-tight leading-snug line-clamp-2 min-h-[3rem]">
                                ${item.resort_name || 'Premium Vacation Resort'}
                            </h4>
                        </div>
                    </div>

                    <div class="p-6 pt-0">
                        <div class="pt-5 border-t border-slate-100 flex items-center justify-between">
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
