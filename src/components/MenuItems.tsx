import { 
  ArrowUp, 
  Bell, 
  Clock, 
  Flame, 
  Info, 
  Leaf, 
  Minus, 
  Plus, 
  Search, 
  ShieldCheck, 
  ShoppingBag, 
  Sparkles, 
  Trash, 
  Utensils, 
  X 
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DineFlowMenu from "./Menu";
import { useParams } from "react-router";
import { socket } from "../services/socket";
import { requestServiceCall } from "../services/api";
import { useNotifications } from "../context/NotificationContext";

/* =========================================================
   TYPES & CONTRACTS (Only types stay here, no static dishes!)
========================================================= */

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  ingredients: string[];
  spiceLevel?: "Mild" | "Medium" | "Hot";
  type: "Veg" | "Non-Veg";
  estimatedTime: string;
  isAvailable?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes: string;
}

export interface WaterOption {
  id: "water-normal" | "water-chilled";
  name: string;
  type: "Normal" | "Chilled";
  price: number;
}

export const Water_Options: WaterOption[] = [
  { id: "water-normal", name: "Drinking water (Room Temp)", type: "Normal", price: 10 },
  { id: "water-chilled", name: "Drinking water (Chilled)", type: "Chilled", price: 12 }
];

export const MenuCategories: string[] = [
  "All",
  "Tandoor & Fire Starters",
  "American Hearth & Smokehouse",
  "Clay-Pot Curries & Gravies",
  "Dum Biryanis & Indian Breads",
  "American Sides & Comforts",
  "Desserts",
  "Drinks & Beverages"
];

interface MenuEnhancementsProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem) => void;
  vegOnly: boolean;
  setVegOnly: (value: boolean) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export default function MenuGridWithExtras({
  items,
  onSelectItem,
  onAddToCart,
  vegOnly,
  setVegOnly,
  cartCount,
  onOpenCart
}: MenuEnhancementsProps) {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [callingService, setCallingService] = useState(false);

  const { addNotification } = useNotifications();
  const { tableId } = useParams();
  const numericTable = Number(tableId?.replace(/\D/g, "")) || 12;

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleVegToggle = (val: boolean) => {
    setVegOnly(val);
    if (val) {
      addNotification("Veg Mode Active", "Non-veg items hidden. Pure vegetarian dishes selected.", "veg", 210);
    } else {
      addNotification("Veg Mode Off", "Full culinary menu active. Tandoor meats and smokehouse cuts visible.", "non-veg", 210);
    }
  };

  const handleCallService = async () => {
    try {
      setCallingService(true);
      socket.emit("table:call_service", {
        tableNumber: numericTable,
        reason: "Waiter assistance requested at table",
        timestamp: new Date().toLocaleTimeString()
      });
      await requestServiceCall(numericTable, "Waiter assistance requested");
      addNotification("Service Request Sent", `Staff alerted for Table #${numericTable}. Assistance is on the way!`, "service", 210);
    } catch {
      addNotification("Service Alert Broadcasted", `Floor staff notified for Table #${numericTable}.`, "service", 210);
    } finally {
      setTimeout(() => setCallingService(false), 3000);
    }
  };

  // Purely uses the MongoDB Atlas items passed from App2
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesVeg = !vegOnly || item.type === "Veg";
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesVeg && matchesSearch;
    });
  }, [items, selectedCategory, vegOnly, searchTerm]);

  const signatureItems = useMemo(() => {
    return items.filter((item) =>
      ["starters-1", "smokehouse-1", "curries-1", "rice-bread-1", "dessert-4"].includes(item.id)
    );
  }, [items]);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="block lg:hidden w-full bg-linear-to-b from-[#181412] to-[#120f0e] select-none border-b border-white/5">
        <div className="px-4 sm:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20">
                <Utensils className="w-4 h-4 text-[#f5a623]" strokeWidth={2.4} />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Dine<span className="text-[#f5a623]">Flow</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCallService}
                disabled={callingService}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/30 text-amber-400 text-xs font-bold active:scale-95 transition cursor-pointer hover:bg-amber-500 hover:text-black"
              >
                <Bell className={`w-3.5 h-3.5 ${callingService ? "animate-spin" : ""}`} />
                <span>{callingService ? "Calling..." : "Call Staff"}</span>
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">T</span>
                <span className="text-xs font-medium text-[#f5a623]">#{tableId?.replace("T", "")}</span>
              </div>
              <DineFlowMenu
                name="Menu"
                className="px-3.5 py-1.5 rounded-full text-xs font-bold text-zinc-950 bg-[#f5a623] hover:bg-[#e0951a] active:scale-95 transition-all shadow-md cursor-pointer"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Top Header */}
      <header className="hidden lg:block w-full bg-linear-to-b from-[#181412] to-[#120f0e] border-b border-white/5 px-8 py-3.5 select-none">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="p-1.5 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20">
              <Utensils className="w-4 h-4 text-[#f5a623]" strokeWidth={2.4} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Dine<span className="text-[#f5a623]">Flow</span>
            </span>
          </div>

          <div className="w-96 relative flex items-center shrink-0">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dishes, cuts, curries, or drinks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-zinc-900/90 border border-white/10 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-[#f5a623] transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleCallService}
            disabled={callingService}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black font-bold text-xs tracking-wide transition-all active:scale-95 cursor-pointer shadow-lg shadow-amber-500/5"
          >
            <Bell className={`w-4 h-4 ${callingService ? "animate-bounce text-black" : ""}`} />
            <span>{callingService ? "Notifying Staff..." : "Call Service"}</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-white/10 shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Table</span>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-xs font-medium text-[#f5a623]">#{tableId?.replace("T", "")}</span>
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="flex relative items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-900/90 border border-white/10 hover:border-[#f5a623]/40 text-zinc-300 hover:text-white transition-all shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#f5a623]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#f5a623] text-zinc-950 text-[10px] font-black">
                {cartCount}
              </span>
            )}
          </button>

          <DineFlowMenu
            name="View Menu"
            className="px-4 py-2 rounded-full text-xs font-bold text-zinc-950 bg-[#f5a623] hover:bg-[#d98218] active:scale-95 transition-all shrink-0 cursor-pointer"
          />
        </div>
      </header>

      {/* Main Dishes Grid Area */}
      <section className="w-full bg-[#0d0c0b] pt-6 pb-3 px-4 sm:px-6 select-none">
        <div className="max-w-7xl mx-auto flex justify-between gap-3 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f5a623]" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.20em] text-[#f5a623]">
                Live Hearth Catalog
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Explore Our Menu
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed max-w-xl">
              Fresh off the glowing charcoal embers — authentic tandoor, smokehouse cuts, and gravies.
            </p>
          </div>

          <div className="flex flex-col items-center select-none w-fit">
            <div className="flex flex-col items-center leading-none">
              <span className="text-sm sm:text-lg font-black tracking-wide text-[#f5a623]">VEG</span>
              <span className="text-[12px] font-black tracking-tight text-white/90">mode</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={vegOnly}
              aria-label="Veg Mode"
              onClick={() => handleVegToggle(!vegOnly)}
              className={`relative mt-2 h-5 w-10 sm:h-7 sm:w-14 rounded-full cursor-pointer transition-colors duration-300 ease-in-out ${
                vegOnly ? "bg-[#00a651]" : "bg-[#2a2622]"
              }`}
            >
              <span
                className={`absolute flex items-center justify-center top-1/2 left-1 h-3 w-3 sm:h-5 sm:w-5 rounded-full -translate-y-1/2 shadow-md transition-transform duration-300 ease-in-out ${
                  vegOnly ? "translate-x-5 sm:translate-x-7 bg-white/90" : "translate-x-0 bg-white/50"
                }`}
              >
                <Leaf className={`w-3 h-3 ${vegOnly ? "text-zinc-700" : "hidden"}`} />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <section className="w-full bg-[#0d0c0b] py-2.5 sm:py-3 select-none">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth">
            {MenuCategories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "border-[#f5a623]/80 text-zinc-950 font-bold bg-[#f5a623] shadow-md"
                      : "bg-[#181614] text-zinc-400 hover:text-white border border-[#2a2622] hover:border-[#f5a623]/30 active:scale-95 cursor-pointer"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Items Rendering */}
      <div className="w-full bg-[#0d0c0b] text-white select-none">
        {signatureItems.length > 0 && !vegOnly && (
          <section className="pt-2 pb-6 px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#f5a623]" />
                <h3 className="text-sm font-black tracking-wider text-white uppercase">
                  Hearth Signatures
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-zinc-500">Chef Recommended</span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
              {signatureItems.map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => onSelectItem(dish)}
                  className="shrink-0 w-64 sm:w-72 snap-start rounded-2xl bg-[#181614] border border-[#2a2622] hover:border-[#f5a623]/40 p-3 flex gap-3 cursor-pointer transition-all duration-200 group"
                >
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-900">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-1 left-1 p-0.5 rounded-md bg-black/60 backdrop-blur-md">
                      <Sparkles className="w-2.5 h-2.5 text-[#f5a623]" />
                    </span>
                  </div>
                  <div className="flex flex-col justify-between min-w-0 flex-1">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-[#f5a623] transition-colors">
                        {dish.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                        {dish.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-black text-[#f5a623]">₹{dish.price}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(dish);
                        }}
                        className="px-2 py-1 rounded-lg bg-zinc-900 border border-[#2a2622] hover:bg-[#f5a623] hover:text-black text-[10px] font-bold text-zinc-300 transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Regular Catalog Cards with SOLD OUT (86'd) support */}
        <section className="px-4 sm:px-6 max-w-7xl mx-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-zinc-500 text-sm">No dishes match your selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {filteredItems.map((item) => {
                const isSoldOut = item.isAvailable === false;
                return (
                  <article
                    key={item.id}
                    onClick={() => !isSoldOut && onSelectItem(item)}
                    className={`group bg-[#181614] border rounded-2xl overflow-hidden transition-all duration-200 ${
                      isSoldOut
                        ? "opacity-60 border-rose-500/20 cursor-not-allowed"
                        : "border-[#2a2622] hover:border-[#f5a623]/40 cursor-pointer"
                    }`}
                  >
                    <div className="relative h-52 overflow-hidden bg-zinc-900">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          isSoldOut ? "grayscale" : "group-hover:scale-105"
                        }`}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-[#141210] via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md text-[10px] font-semibold text-zinc-300">
                        {item.category}
                      </span>
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-black uppercase tracking-wider">
                            Sold Out (86&apos;d)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white truncate group-hover:text-[#f5a623] transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <span className="text-base font-black text-[#f5a623] whitespace-nowrap">
                          ₹{item.price}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 text-zinc-500">
                        <Clock className="w-3.5 h-3.5 text-[#f5a623]/80" />
                        <span className="text-[11px]">{item.estimatedTime}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.ingredients.slice(0, 3).map((ingredient) => (
                          <span key={ingredient} className="px-2 py-1 rounded-md bg-[#211b17] text-[9px] text-zinc-400">
                            {ingredient}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={isSoldOut}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(item);
                        }}
                        className={`w-full mt-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                          isSoldOut
                            ? "bg-zinc-800 text-zinc-500 border border-transparent cursor-not-allowed"
                            : "bg-[#211b17] border border-[#2a2622] hover:bg-[#f5a623] hover:text-black text-white cursor-pointer"
                        }`}
                      >
                        {isSoldOut ? "Sold Out" : <><Plus className="w-4 h-4" /> Add to Cart</>}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {showBackToTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-5 sm:right-8 z-40 p-3 rounded-full bg-[#181614] border border-[#f5a623]/40 text-[#f5a623] hover:bg-[#f5a623] hover:text-black shadow-2xl transition-all duration-200 cursor-pointer active:scale-90"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      <footer className="border-t border-[#211e1a] bg-[#0d0c0b] px-4 py-4 select-none">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-medium text-zinc-500">FSSAI Compliant</span>
            </div>
            <span className="w-px h-3 bg-zinc-800" />
            <span className="text-[10px] text-zinc-600">
              Powered by <span className="text-zinc-500 font-semibold">DineFlow</span>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}


interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, notes: string) => void;
}

export function ItemDetailModal({ item, onClose, onAddToCart }: ItemDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setNotes("");
    }
  }, [item]);

  if (!item) return null;

  const isSoldOut = item.isAvailable === false;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="sm:hidden absolute -top-12 z-20 flex h-9 w-9 items-center justify-center cursor-pointer rounded-full bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 backdrop-blur-md shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col w-full h-[88vh] sm:h-auto sm:max-h-[90vh] bg-zinc-950 border-t sm:border border-zinc-800/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
            {/* Image Header */}
            <div className="relative h-[34vh] sm:h-64 w-full select-none shrink-0 bg-zinc-900 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className={`w-full h-full object-cover ${isSoldOut ? "grayscale" : ""}`}
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#141210] via-transparent to-transparent" />
              <div className="absolute top-3 left-4">
                <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-wider font-semibold text-zinc-200">
                  {item.category}
                </span>
              </div>
              <div className="absolute top-3 right-3 flex items-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden sm:flex z-20 h-9 w-9 items-center justify-center cursor-pointer rounded-full bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 backdrop-blur-md shadow-lg transition-transform hover:bg-zinc-800 hover:text-white active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isSoldOut && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-black uppercase tracking-wider">
                    Sold Out (86&apos;d)
                  </span>
                </div>
              )}
            </div>

            {/* Details Content */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-xs border flex items-center justify-center p-0.5 ${
                    item.type === "Veg" ? "border-emerald-500" : "border-rose-500"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.type === "Veg" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                </div>
                {item.spiceLevel && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <span className="text-xs leading-none">🌶️</span>
                    <span>{item.spiceLevel}</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-1 text-xs text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-[#f5a623]" />
                  <span>{item.estimatedTime}</span>
                </div>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {item.name}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {item.ingredients?.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Ingredients
                  </h3>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                    {item.ingredients.map((ing) => (
                      <span
                        key={ing}
                        className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] sm:text-xs text-zinc-400 shrink-0"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSoldOut}
                  placeholder="Less spicy, no onions, extra dip..."
                  rows={2}
                  className="w-full rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 p-3 outline-none focus:border-[#f5a623] transition-all resize-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 sm:p-5 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800/80 flex items-center gap-3">
            <div className="flex items-center border border-zinc-800 bg-zinc-950 rounded-xl p-1 shrink-0">
              <button
                type="button"
                disabled={isSoldOut}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition disabled:opacity-30"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center text-sm font-semibold text-white select-none">
                {quantity}
              </span>
              <button
                type="button"
                disabled={isSoldOut}
                onClick={() => setQuantity((q) => q + 1)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition disabled:opacity-30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              disabled={isSoldOut}
              onClick={() => {
                if (!isSoldOut) {
                  onAddToCart(item, quantity, notes);
                  onClose();
                }
              }}
              className="flex-1 flex items-center justify-between px-5 h-11 rounded-xl bg-[#f5a623] hover:bg-[#e0951a] cursor-pointer active:scale-[0.99] text-zinc-950 font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{isSoldOut ? "Item Unavailable" : "Add to Cart"}</span>
              <span>₹{item.price * quantity}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CartDrawerProps {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (id: string, change: number) => void;
  onRemove: (id: string) => void;
  onPlaceOrder: () => void;
  normalWaterQty: number;
  setNormalWaterQuantity: React.Dispatch<React.SetStateAction<number>>;
  chilledWaterQty: number;
  setChilledWaterQuantity: React.Dispatch<React.SetStateAction<number>>;
  wantsWater: boolean;
  setWaterWants: React.Dispatch<React.SetStateAction<boolean>>;
}

export function CartDrawer({
  cart,
  onClose,
  onUpdateQuantity,
  onRemove,
  onPlaceOrder,
  normalWaterQty,
  setNormalWaterQuantity,
  chilledWaterQty,
  setChilledWaterQuantity,
  wantsWater,
  setWaterWants
}: CartDrawerProps) {
  const { tableId } = useParams();

  const foodSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const waterTotal = normalWaterQty * 10 + chilledWaterQty * 12;
  const subtotal = foodSubtotal + waterTotal;
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-[#141210] border-l border-[#2a2622] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2622]">
          <div>
            <h2 className="text-lg font-black text-white">Your Cart</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Table #{tableId?.replace("T", "") || "T12"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#211b17] text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Water Bottle Add-on Section */}
        <div className="p-3 mx-4 mt-3 rounded-xl bg-[#1b1816] border border-[#2a2622]">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-white select-none">
            <input
              type="checkbox"
              checked={wantsWater}
              onChange={(e) => setWaterWants(e.target.checked)}
              className="w-4 h-4 accent-[#f5a623] rounded cursor-pointer"
            />
            <span>Add Sealed Water Bottles</span>
          </label>

          {wantsWater && (
            <div className="p-3 rounded-xl bg-[#141210] border border-[#2a2622] space-y-2.5 mt-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#1b1816] border border-[#2a2622]">
                <div>
                  <p className="text-xs font-bold text-white">Room Temp (500ml)</p>
                  <span className="text-[10px] text-zinc-400">₹10</span>
                </div>
                <div className="flex items-center gap-2">
                  {normalWaterQty > 0 && (
                    <button
                      type="button"
                      onClick={() => setNormalWaterQuantity((q) => Math.max(0, q - 1))}
                      className="w-6 h-6 rounded bg-[#2a2622] text-white font-bold text-xs cursor-pointer"
                    >
                      -
                    </button>
                  )}
                  {normalWaterQty > 0 && (
                    <span className="text-xs font-black text-[#f5a623]">{normalWaterQty}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setNormalWaterQuantity((q) => q + 1)}
                    className="px-2 py-1 rounded bg-[#f5a623] text-black font-black text-xs cursor-pointer"
                  >
                    {normalWaterQty === 0 ? "+ Add" : "+"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#1b1816] border border-[#2a2622]">
                <div>
                  <p className="text-xs font-bold text-white">Chilled (500ml)</p>
                  <span className="text-[10px] text-zinc-400">₹12</span>
                </div>
                <div className="flex items-center gap-2">
                  {chilledWaterQty > 0 && (
                    <button
                      type="button"
                      onClick={() => setChilledWaterQuantity((q) => Math.max(0, q - 1))}
                      className="w-6 h-6 rounded bg-[#2a2622] text-white font-bold text-xs cursor-pointer"
                    >
                      -
                    </button>
                  )}
                  {chilledWaterQty > 0 && (
                    <span className="text-xs font-black text-[#f5a623]">{chilledWaterQty}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setChilledWaterQuantity((q) => q + 1)}
                    className="px-2 py-1 rounded bg-[#f5a623] text-black font-black text-xs cursor-pointer"
                  >
                    {chilledWaterQty === 0 ? "+ Add" : "+"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <ShoppingBag className="w-10 h-10 text-zinc-700" />
              <h3 className="text-sm font-bold text-zinc-300 mt-3">Your cart is empty</h3>
              <p className="text-xs text-zinc-600 mt-1">Add some dishes from the menu.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={`${item.id}-${item.notes}-${index}`}
                  className="p-3 rounded-xl bg-[#181614] border border-[#2a2622]"
                >
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-18 h-18 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onRemove(item.id)}
                          className="text-zinc-600 hover:text-rose-400 shrink-0 cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#f5a623] font-bold mt-0.5">₹{item.price}</p>
                      {item.notes && (
                        <div className="mt-1 flex items-start gap-1 text-[10px] text-zinc-400">
                          <Info className="w-3 h-3 text-[#f5a623] shrink-0 mt-0.5" />
                          <span className="truncate">{item.notes}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-2 bg-[#211b17] rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center text-white select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-white">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary & Proceed */}
        {cart.length > 0 && (
          <div className="border-t border-[#2a2622] p-5">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Food Subtotal</span>
                <span>₹{foodSubtotal}</span>
              </div>
              {wantsWater && waterTotal > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Packaged Water</span>
                  <span>₹{waterTotal}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>GST (5%)</span>
                <span>₹{gst}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-[#2a2622]">
                <span>Total</span>
                <span className="text-[#f5a623]">₹{total}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onPlaceOrder}
              className="w-full mt-4 py-3 rounded-xl bg-[#f5a623] text-black font-black text-xs sm:text-sm hover:brightness-110 transition cursor-pointer"
            >
              Review & Place Order
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}