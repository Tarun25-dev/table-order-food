import { ArrowLeft, Award, Calendar, Quote, Sparkles, Star, Utensils,} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

type Category = "all" | "awards" | "celebrities" | "milestones" | "craft";

interface GalleryItem {
    id: string;
    category: "awards" | "celebrities" | "milestones" | "craft";
    title: string;
    subtitle: string;
    date: string;
    image: string;
    quote?: string;
    author?: string;
    description: string;
}

const galleryData: GalleryItem[] = [
  {
    id: '1',
    category: 'awards',
    title: 'Michelin Guide 2025 Plaque',
    subtitle: 'Culinary Distinction of Excellence',
    date: 'October 2025',
    image: '/images/Gallery/g1.png',
    description: 'Awarded for our commitment to sustainable sourcing, precision wood-fired techniques, and harmonious menu composition.'
  },
  {
    id: '2',
    category: 'celebrities',
    title: 'Chef Marcus Sterling Visit',
    subtitle: 'Culinary Critic & TV Host',
    date: 'August 2025',
    image: 'images/Gallery/g2.png',
    quote: 'The grilled herb chicken at DineFlow is quite simply an unmatched standard of flavor balance.',
    author: '@marcus_tastes',
    description: 'A wonderful evening hosting Chef Marcus in our open hearth kitchen during his international culinary tour.'
  },
  {
    id: '3',
    category: 'milestones',
    title: '10th Anniversary Gala',
    subtitle: 'A Decade of Unforgettable Nights',
    date: 'May 2025',
    image: 'images/Gallery/g3.png',
    description: 'Celebrating over 100,000 guests served, surrounded by regular patrons, culinary mentors, and our dedicated kitchen brigade.'
  },
  {
    id: '4',
    category: 'craft',
    title: 'Hearth Wood-Fire Station',
    subtitle: 'Artisanal Oak & Charcoal Fire',
    date: 'Ongoing Tradition',
    image: 'images/Gallery/g4.png',
    description: 'Our custom-built open stone hearth where every poultry cut and dry-aged steak meets fragrant applewood smoke.'
  },
  {
    id: '5',
    category: 'celebrities',
    title: 'Elena Rostova Dining Experience',
    subtitle: 'Acclaimed Film Director',
    date: 'December 2025',
    image: 'images/Gallery/g5.png',
    quote: 'An oasis of calm and supreme culinary precision. The black truffle jus was pure cinema.',
    author: '@elena_cinema',
    description: 'Private candlelit booth reservation following her festival premiere.'
  },
  {
    id: '6',
    category: 'awards',
    title: 'Wine Spectator Best of Award',
    subtitle: 'Excellence in Sommelier Selection',
    date: 'July 2025',
    image: 'images/Gallery/g6.png',
    description: 'Recognizing our cellar containing over 450 natural and biodynamic regional vintages.'
  },
  {
    id: '7',
    category: 'craft',
    title: 'Morning Farm Harvest Delivery',
    subtitle: 'Zero-Mile Organic Produce',
    date: 'Daily Ritual',
    image: 'images/Gallery/g7.png',
    description: 'Unboxing wild rosemary, heirloom carrots, and field greens hand-harvested just hours before table service.'
  },
  {
    id: '8',
    category: 'milestones',
    title: 'Chef Alexander’s Masterclass',
    subtitle: 'Mentoring the Next Generation',
    date: 'January 2026',
    image: 'images/Gallery/g8.png',
    description: 'Annual charity kitchen session opening our line to ambitious culinary academy graduates.'
  }
];

const filters: { label: string; key: Category }[] = [
  {label: "All Showcase", key: "all"},
  {label: "Awards & Accolades", key: "awards"},
  {label: "Celebrity Guests", key: "celebrities"},
  {label: "Milestones", key: "milestones"},
  {label: "Culinary Craft", key: "craft"}
];

export default function Gallery(){

  const [activeFilter, setActiveFilter] = useState<Category>("all");
  const navigate = useNavigate();

  const handleBackHome = () => {
    if (window.opener && !window.opener.closed){
      window.close();
    } else {
      navigate("/");
    }
  };

  const filteredItems = activeFilter === "all" ? galleryData : galleryData.filter((item) => item.category === activeFilter);

  return(
        <div className="w-full min-h-screen bg-[#100e0d] text-white font-sans selection:bg-[#f5a623] selection:text-black">
          <header className="sticky top-0 z-40 w-full bg-[#141210]/90 backdrop-blur-md border-b border-white/10 px-6 sm:px-12 py-5">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <button onClick={handleBackHome} className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-[#f5a623] transition-colors group cursor-pointer">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Return to DineFlow</span>
              </button>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#f5a623]" />
                <span className="text-xl font-bold tracking-tight text-white">
                  Dine <span className="text-[#f5a623]">Flow</span>
                </span>
              </div>
            </div>
          </header>
          <section className="relative py-16 sm:py-24 px-6 sm:px-12 overflow-hidden border border-white/5">
            <div className="absolute top-1/2 left-1/2 -translate-x-1 -translate-y-1/2 w-125 h-124 bg-[#f5a623]/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="max-w-7xl mx-auto text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#f5a623] mb-4">
            <Sparkles className="w-3.5 h-3.5"/>
            <span>Permanent Visual Archive</span>              
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
                Moments, Accolades & Artistry
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">A celebration of international culinary prizes,  cherished celebrity evenings, and quiet instances of flame-charred mastery.</p>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 sm:px-12 pt-10 pb-6">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
              {filters.map((tab) => (
                <button key={tab.key} onClick={() => setActiveFilter(tab.key)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${activeFilter === tab.key ? "bg-[#f5a623] text-zinc-950 shadow-lg shadow-[#f5a623]/20" : "bg-zinc-900/80 text-zinc-400 border border-white/10 hover:border-[#f5a623]/40 hover:text-white"}`}>{tab.label}</button>
              ))}
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6 sm:px-12 pb-24">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredItems.map((item) => (
                  <div key={item.id} className="group relative rounded-2xl bg-zinc-900/60 border border-white/10 overflow-hidden shadow-xl hover:border-[#f5a623]/50 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                    <div className="relative w-full h-64 overflow-hidden bg-zinc-950">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                    </div>
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 text-[#f5a623] text-[11px] font-semibold gap-1.5 flex items-center border border-white/10 rounded-full">
                      {item.category === "awards" && <Award className="w-3.5 h-3.5"/>}
                      {item.category === "celebrities" && <Star className="w-3.5 h-3.5"/>}
                      {item.category === "milestones" && <Calendar className="w-3.5 h-3.5"/>}
                      {item.category === "craft" && <Utensils className="w-3.5 h-3.5"/>}
                      <span className="capitalize">{item.category}</span>
                    </div>
                    <div className="absolute bottom-3 left-4 text-[11px] font-medium text-zinc-400">{item.date}</div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-[#f5a623] transition-colors mb-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium mb-3">
                          {item.subtitle}
                        </p>
                        {item.quote && (
                          <div className="relative bg-white/5 border border-white/5 rounded-xl p-3.5 mb-3">
                            <Quote className="w-4 h-4 text-[#f5a623] mb-1 opacity-70" />
                            <p className="text-xs text-zinc-300 italic leading-relaxed">{item.quote}</p>
                            {item.author && (
                              <span className="block mt-1.5 text-[11px] font-semibold text-[#f5a623]">{item.author}</span>
                            )}
                            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{item.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </section>
        </div>
    );
}