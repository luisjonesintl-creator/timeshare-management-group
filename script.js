// ====== CONFIGURATION STEP ======
const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) 
  || window._env_?.NEXT_PUBLIC_SUPABASE_URL 
  || "https://ztojbyfbyidzzrqicjvn.supabase.co";

// CORREGIDA: Se cambió 'qeRJ' por 'qcRJ' para que coincida exactamente con tu proyecto de Supabase
const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) 
  || window._env_?.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  || "sb_publishable_qcRJ-QyT9qEuVSG4DFvL3g_An-j7QPC";

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

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const client = getSupabaseClient();
        if (!client) {
            console.error("Critical connection failure: Supabase engine not initialized.");
            return;
        }
        if (document.getElementById("active-properties")) {
            loadPublicMarketplace(client);
            setupLeadSubmission(client);
        }
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
                            '<div class="h-56 w-full bg-gradient-to-tr from-slate-900 via-blue-950 to-cyan-900 flex items-center justify-center relative">' +
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
