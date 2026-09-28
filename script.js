            // Definimos el color de la etiqueta según el tipo de oferta comercial
            const isSale = item.listing_type === 'SALE';
            const badgeBg = isSale ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-cyan-50 text-cyan-800 border-cyan-200';

            // Estructura HTML de la tarjeta con inyección de datos limpia y nativa
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

// Lógica de control global nativa para cambiar las imágenes por tarjeta
window.switchNativeSlide = function(cardIndex, direction) {
    const slider = document.getElementById(`native-slider-${cardIndex}`);
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.slide-item');
    let activeIndex = -1;
    
    slides.forEach((slide, idx) => {
        if (!slide.classList.contains('hidden')) activeIndex = idx;
    });
    
    if (activeIndex === -1) return;
    
    let nextIndex = activeIndex + direction;
    if (nextIndex >= slides.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = slides.length - 1;
    
    slides[activeIndex].classList.add('hidden');
    slides[nextIndex].classList.remove('hidden');
    
    const badge = document.getElementById(`slide-badge-${cardIndex}`);
    if (badge) badge.innerText = `${nextIndex + 1} / ${slides.length}`;
};

// Inicialización automática cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderProperties();
});
