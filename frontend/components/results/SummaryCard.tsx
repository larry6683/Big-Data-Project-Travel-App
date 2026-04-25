import React from "react";

export default function SummaryCard({ data }: { data: any }) {
  // Extract destination name
  const rawDest = data?.rawParams?.destination;
  const destination = typeof rawDest === 'object' ? rawDest.name : rawDest || "Your Destination";

  // Safely extract descriptions and fun facts with dynamic fallbacks
  const description = data?.destinationInfo?.description 
    || "Get ready for an unforgettable journey. Here is a quick snapshot of the local atmosphere, top sights, and everything you need to know.";
  
  const funFact = data?.destinationInfo?.fun_fact 
    || `${destination} is full of hidden gems, vibrant local culture, and incredible landmarks waiting to be discovered.`;

  const attractions = data?.attractions || [];
  
  // --- NEW: High-Quality Placeholder Image from the Internet ---
  const placeholderImage = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=800&auto=format&fit=crop";

  // Try to find a city image. If nothing exists, it uses the internet placeholder!
  const cityImage = data?.destinationInfo?.image_url 
    || data?.destinationInfo?.photo 
    || data?.destinationInfo?.image
    || attractions?.[0]?.photo 
    || attractions?.[0]?.image_url
    || placeholderImage;

  // Weather extraction logic
  const weather = data?.weather;
  const firstDay = weather?.days?.[0];

  const temp = firstDay?.max_temp 
    ?? weather?.current?.temp_f 
    ?? weather?.main?.temp 
    ?? weather?.currentConditions?.temp 
    ?? weather?.temperature 
    ?? weather?.temp 
    ?? "--";
    
  const condition = firstDay?.weather 
    ?? weather?.current?.condition?.text 
    ?? weather?.weather?.[0]?.description 
    ?? weather?.currentConditions?.conditions 
    ?? weather?.condition 
    ?? "Awaiting Forecast";

  const idealMonth = weather?.ideal_month ?? data?.destinationInfo?.ideal_month ?? "September";

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- REDESIGNED WELCOME SECTION --- */}
      <div className="p-6 md:p-8 bg-theme-secondary rounded-3xl border border-theme-surface shadow-sm flex flex-col md:flex-row gap-6 md:gap-10 items-stretch">
        
        {/* Left Side: Text Details */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          <h2 className="text-4xl md:text-5xl font-black text-theme-bg tracking-tight capitalize">
            {destination}
          </h2>
          <p className="text-theme-muted font-medium text-sm md:text-base leading-relaxed max-w-xl">
            {description}
          </p>
          
          <div className="mt-2 p-4 bg-theme-bg rounded-2xl border border-theme-surface shadow-sm inline-flex flex-col gap-1.5 self-start max-w-xl">
            <span className="text-[10px] uppercase font-black tracking-widest text-theme-primary flex items-center gap-1.5">
              💡 Fun Fact
            </span>
            <span className="text-theme-text text-sm font-bold leading-snug">
              {funFact}
            </span>
          </div>
        </div>

        {/* Right Side: City Image (Now with Placeholder) */}
        <div className="w-full md:w-[35%] h-64 md:h-auto min-h-[220px] flex-shrink-0 relative rounded-[2rem] overflow-hidden shadow-md border-4 border-theme-bg">
          <img 
            src={cityImage} 
            alt={destination} 
            className="w-full h-full object-cover absolute inset-0 hover:scale-105 transition-transform duration-700" 
          />
        </div>
      </div>
      {/* --- END WELCOME SECTION --- */}


      {/* Atmospheric Forecast Block */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-theme-text to-theme-secondary border border-theme-surface p-6 md:p-8 shadow-xl">
        <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
          <span className="text-[150px]">☁️</span>
        </div>
        
        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-theme-primary mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse"></span>
          Atmospheric Forecast
        </h3>
        
        <div className="flex items-end gap-3 md:gap-4 relative z-10">
          <div className="text-5xl md:text-7xl font-black text-theme-muted tracking-tighter">
            {typeof temp === "number" ? Math.round(temp) : temp}°
          </div>
          <div className="pb-1 md:pb-2 text-theme-muted font-bold text-sm md:text-lg capitalize">{condition}</div>
        </div>
        
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-primary/10 text-theme-primary text-xs font-black border border-theme-primary/20 backdrop-blur-md">
          ✨ Ideal Month to Visit: {idealMonth}
        </div>
      </div>


      {/* Must-See Sights Carousel */}
      <div className="mt-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-theme-text mb-4 ml-2">Must-See Sights</h3>
        <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
        
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar scroll-smooth">
          {attractions.length > 0 ? (
            attractions.map((attr: any, i: number) => {
              const image = attr.photo || attr.thumbnail || attr.image_url;
              const name = attr.name || attr.tags?.name || 'Interesting Place';
              const attrDescription = attr.description || (attr.category || attr.tags?.tourism || 'Popular Attraction').replace(/_/g, " ");

              return (
                <div key={i} className="min-w-[260px] max-w-[260px] sm:min-w-[300px] sm:max-w-[300px] snap-center bg-theme-bg border border-theme-surface rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-grab active:cursor-grabbing">
                  <div className="w-full h-40 bg-theme-surface rounded-xl mb-3 overflow-hidden relative flex-shrink-0">
                    {image ? (
                      <img src={image} alt={name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🎡</div>
                    )}
                  </div>
                  <h4 className="font-bold text-theme-text truncate text-sm md:text-base">{name}</h4>
                  <p className="text-xs text-theme-muted mt-1 line-clamp-2 capitalize">
                    {attrDescription}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-theme-muted p-4 border border-theme-surface border-dashed rounded-xl w-full text-center">
              No top attractions found for this specific area.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}