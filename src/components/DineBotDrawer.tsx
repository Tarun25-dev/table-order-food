import { useEffect, useRef, useState } from "react";
import type { MenuItem, CartItem } from "./MenuItems";
import { Bot, ChefHat, Droplet, Plus, Send, X } from "lucide-react";

interface Props {
  menuItems: MenuItem[];
  cart: CartItem[];
  normalWaterQty: number;
  chilledWaterQty: number;
  onAddToCart: (item: MenuItem, quantity?: number, notes?: string) => void;
  onAddWater: (type: 'Normal' | 'Chilled') => void;
  onCallService?: (reason: string) => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  options?: { label: string; action: string }[];
  recommendations?: MenuItem[];
  waterCard?: boolean;
  billCard?: boolean;
}

export function DineBotDrawer({
  menuItems,
  cart,
  normalWaterQty,
  chilledWaterQty,
  onAddToCart,
  onAddWater,
  onCallService
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Good evening! I am your Hearth Concierge. How may I orchestrate your meal this evening?',
      options: [
        { label: '🔥 Chef’s Signatures', action: 'signatures' },
        { label: '🌱 Pure Vegetarian', action: 'veg' },
        { label: '🍗 Smokehouse & Grills', action: 'nonveg' },
        { label: '💧 Need Water', action: 'water' },
        { label: '🧾 Check Running Bill', action: 'bill' },
        { label: '🛎️ Call Waiter', action: 'call_server' }
      ]
    }
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Financial calculations for bill previews
  const foodTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const waterTotal = normalWaterQty * 10 + chilledWaterQty * 12;
  const subtotal = foodTotal + waterTotal;
  const gst = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + gst;

  const pushMessage = (msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: Math.random().toString(36).substring(7) }]);
  };

  const handleAction = (action: string, label?: string) => {
    if (label) {
      pushMessage({ sender: 'user', text: label });
    }

    setTimeout(() => {
      switch (action) {
        case 'signatures': {
          const featured = menuItems.filter((i) =>
            ['Murgh Malai Tikka', 'Old Delhi Butter Chicken', 'Hyderabadi Dum Gosht Biryani', 'Peshawari Paneer Tikka'].includes(i.name)
          );
          pushMessage({
            sender: 'bot',
            text: 'Here are our most celebrated wood-fired hearth signatures:',
            recommendations: featured.length ? featured : menuItems.slice(0, 3),
            options: [
              { label: 'Bread Pairings', action: 'category_breads' },
              { label: 'Desserts & Sweets', action: 'category_desserts' },
              { label: 'Back to Menu', action: 'reset' }
            ]
          });
          break;
        }

        case 'veg': {
          pushMessage({
            sender: 'bot',
            text: 'What kind of vegetarian course would you like to explore?',
            options: [
              { label: 'Tandoor Starters', action: 'veg_starters' },
              { label: 'Rich Curries & Dals', action: 'veg_curries' },
              { label: 'Dum Biryani', action: 'veg_biryani' },
              { label: 'Mild Only (No Spice)', action: 'veg_mild' }
            ]
          });
          break;
        }

        case 'nonveg': {
          pushMessage({
            sender: 'bot',
            text: 'Straight from the charcoal pit! Which meats do you prefer?',
            options: [
              { label: 'Chicken Specials', action: 'nonveg_chicken' },
              { label: 'Mutton & Lamb', action: 'nonveg_mutton' },
              { label: 'Coastal Seafood', action: 'nonveg_fish' },
              { label: 'Fiery / Hot Spice 🔥', action: 'nonveg_hot' }
            ]
          });
          break;
        }

        case 'veg_starters': {
          const items = menuItems.filter((i) => i.type === 'Veg' && i.category.toLowerCase().includes('starter'));
          pushMessage({
            sender: 'bot',
            text: 'Here are our charred vegetarian starters:',
            recommendations: items.slice(0, 3),
            options: [{ label: 'Explore Main Course', action: 'veg_curries' }]
          });
          break;
        }

        case 'veg_curries': {
          const items = menuItems.filter((i) => i.type === 'Veg' && i.category.toLowerCase().includes('curries'));
          pushMessage({
            sender: 'bot',
            text: 'Slow-simmered clay-pot curries and buttery dals:',
            recommendations: items.slice(0, 3),
            options: [{ label: 'Add Tandoori Naan/Roti', action: 'category_breads' }]
          });
          break;
        }

        case 'veg_biryani': {
          const items = menuItems.filter((i) => i.type === 'Veg' && i.name.toLowerCase().includes('biryani'));
          pushMessage({
            sender: 'bot',
            text: 'Fragrant saffron basmati steamed under sealed dough:',
            recommendations: items,
            options: [{ label: 'Order Drinks', action: 'category_drinks' }]
          });
          break;
        }

        case 'veg_mild': {
          const items = menuItems.filter((i) => i.type === 'Veg' && i.spiceLevel === 'Mild');
          pushMessage({
            sender: 'bot',
            text: 'Comforting, mild options with cream, cashews, and delicate aroma:',
            recommendations: items.slice(0, 3),
            options: [{ label: 'Back to Menu', action: 'reset' }]
          });
          break;
        }

        case 'nonveg_chicken': {
          const items = menuItems.filter((i) => i.type === 'Non-Veg' && (i.name.toLowerCase().includes('murgh') || i.name.toLowerCase().includes('chicken')));
          pushMessage({
            sender: 'bot',
            text: 'Our tender wood-smoked chicken delicacies:',
            recommendations: items.slice(0, 3),
            options: [{ label: 'Add Naan / Rotis', action: 'category_breads' }]
          });
          break;
        }

        case 'nonveg_mutton': {
          const items = menuItems.filter((i) => i.name.toLowerCase().includes('gosht') || i.name.toLowerCase().includes('mutton') || i.name.toLowerCase().includes('lamb'));
          pushMessage({
            sender: 'bot',
            text: 'Rich Kashmiri Rogan Josh and Dum Biryani:',
            recommendations: items.slice(0, 3),
            options: [{ label: 'Desserts', action: 'category_desserts' }]
          });
          break;
        }

        case 'nonveg_fish': {
          const items = menuItems.filter((i) => i.name.toLowerCase().includes('fish') || i.name.toLowerCase().includes('prawn'));
          pushMessage({
            sender: 'bot',
            text: 'Fresh fish fry and garlic butter grilled prawns:',
            recommendations: items.slice(0, 3)
          });
          break;
        }

        case 'nonveg_hot': {
          const items = menuItems.filter((i) => i.type === 'Non-Veg' && i.spiceLevel === 'Hot');
          pushMessage({
            sender: 'bot',
            text: 'Infused with roasted Kashmiri chilies and peppercorn:',
            recommendations: items.slice(0, 3),
            options: [{ label: 'Get Cooling Lassi / Chaas', action: 'category_drinks' }]
          });
          break;
        }

        case 'category_breads': {
          const items = menuItems.filter((i) => i.category.toLowerCase().includes('bread'));
          pushMessage({
            sender: 'bot',
            text: 'Fresh flatbreads pulled straight from the clay tandoor:',
            recommendations: items.slice(0, 3),
            options: [{ label: 'View Desserts', action: 'category_desserts' }]
          });
          break;
        }

        case 'category_desserts': {
          const items = menuItems.filter((i) => i.category.toLowerCase().includes('dessert'));
          pushMessage({
            sender: 'bot',
            text: 'Sweet finishes and decadent treats:',
            recommendations: items,
            options: [{ label: 'Check Bill', action: 'bill' }]
          });
          break;
        }

        case 'category_drinks': {
          const items = menuItems.filter((i) => i.category.toLowerCase().includes('drink'));
          pushMessage({
            sender: 'bot',
            text: 'Cooling beverages, smoked chaas, and artisanal mocktails:',
            recommendations: items
          });
          break;
        }

        case 'water': {
          pushMessage({
            sender: 'bot',
            text: 'Would you like packaged drinking water brought to your table?',
            waterCard: true
          });
          break;
        }

        case 'bill': {
          pushMessage({
            sender: 'bot',
            text: 'Here is your current running table summary:',
            billCard: true,
            options: [
              { label: 'Order More Dishes', action: 'signatures' },
              { label: 'Call Server for Cash/Card', action: 'call_server' }
            ]
          });
          break;
        }

        case 'call_server': {
          onCallService?.('Table requested physical assistance via Concierge Bot');
          pushMessage({
            sender: 'bot',
            text: '🛎️ A priority service alert has been sent to the floor captain. Someone is heading to your table.'
          });
          break;
        }

        default: {
          pushMessage({
            sender: 'bot',
            text: 'How can I assist your table next?',
            options: [
              { label: '🔥 Chef’s Signatures', action: 'signatures' },
              { label: '🌱 Pure Vegetarian', action: 'veg' },
              { label: '🍗 Smokehouse & Grills', action: 'nonveg' },
              { label: '💧 Need Water', action: 'water' },
              { label: '🧾 Check Bill', action: 'bill' }
            ]
          });
        }
      }
    }, 300);
  };

  // Natural Language Intent Engine
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = input.toLowerCase().trim();
    const userText = input;
    setInput('');

    pushMessage({ sender: 'user', text: userText });

    setTimeout(() => {
      // 1. Water requests
      if (query.includes('water') || query.includes('bottle')) {
        if (query.includes('cold') || query.includes('chilled')) {
          onAddWater('Chilled');
          pushMessage({
            sender: 'bot',
            text: 'Added 1x Chilled Water bottle to your cart (₹12).'
          });
        } else if (query.includes('normal') || query.includes('room')) {
          onAddWater('Normal');
          pushMessage({
            sender: 'bot',
            text: 'Added 1x Normal Drinking Water bottle to your cart (₹10).'
          });
        } else {
          handleAction('water');
        }
        return;
      }

      // 2. Bill / Check queries
      if (query.includes('bill') || query.includes('check') || query.includes('total') || query.includes('amount')) {
        handleAction('bill');
        return;
      }

      // 3. Waiter / assistance
      if (
        query.includes('waiter') ||
        query.includes('captain') ||
        query.includes('call') ||
        query.includes('help') ||
        query.includes('service')
      ) {
        handleAction('call_server');
        return;
      }

      // 4. Desserts & sweets
      if (
        query.includes('sweet') ||
        query.includes('dessert') ||
        query.includes('ice cream') ||
        query.includes('cake') ||
        query.includes('jamun')
      ) {
        handleAction('category_desserts');
        return;
      }

      // 5. Breads & Naan
      if (query.includes('roti') || query.includes('naan') || query.includes('bread') || query.includes('paratha')) {
        handleAction('category_breads');
        return;
      }

      // 6. Biryani
      if (query.includes('biryani') || query.includes('rice')) {
        if (query.includes('veg')) handleAction('veg_biryani');
        else handleAction('nonveg_mutton');
        return;
      }

      // 7. Spice Level queries
      if (query.includes('spicy') || query.includes('hot') || query.includes('teekha')) {
        handleAction('nonveg_hot');
        return;
      }
      if (query.includes('mild') || query.includes('less spicy')) {
        handleAction('veg_mild');
        return;
      }

      // 8. General Diet Filters
      if (
        query.includes('non') ||
        query.includes('chicken') ||
        query.includes('meat') ||
        query.includes('mutton') ||
        query.includes('fish')
      ) {
        handleAction('nonveg');
        return;
      }
      if (query.includes('veg') || query.includes('paneer') || query.includes('dal')) {
        handleAction('veg');
        return;
      }

      // Fallback
      pushMessage({
        sender: 'bot',
        text: "I'd love to help you with that! Are you looking for dish recommendations, water, or your bill?",
        options: [
          { label: '🔥 Signatures', action: 'signatures' },
          { label: '🌱 Veg Dishes', action: 'veg' },
          { label: '🍗 Non-Veg Dishes', action: 'nonveg' },
          { label: '💧 Water', action: 'water' }
        ]
      });
    }, 350);
  };
    return(
        <>
        {!isOpen && (
            <button type="button" onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 sm:right-auto sm:left-6 z-999 flex items-center gap-2.5 rounded-full border border-[#f5a623]/40 bg-[#1b1816] px-2 py-2 sm:px-3 sm:py-3 text-[#f5a623] shadow-2xl transition hover:bg-[#2a2622] active:scale-95 cursor-pointer">
                <div className="relative">
                    <Bot className="h-5 w-5" />
                </div>
                </button>
        )}

        {isOpen && (
        <div className="fixed bottom-6 left-6 z-1000 flex h-137.5 w-[92vw] sm:w-100 flex-col overflow-hidden rounded-2xl border border-[#2a2622] bg-[#141210] shadow-2xl backdrop-blur-md">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-[#2a2622] bg-[#1b1816] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/30">
                <ChefHat className="h-4 w-4 text-[#f5a623]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Hearth Concierge</h3>
                <p className="text-[10px] text-zinc-400">Personal Dining & Pairing Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-zinc-400 hover:text-white cursor-pointer transition"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs no-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Text Bubble */}
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#f5a623] font-bold text-black shadow-md'
                      : 'border border-[#2a2622] bg-[#1b1816] text-zinc-200'
                  }`}
                >
                  {m.text}
                </div>

                {/* Direct Dish Recommendations with One-Click Add */}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="mt-2.5 w-full space-y-2">
                    {m.recommendations.map((dish) => (
                      <div
                        key={dish.id}
                        className="flex items-center justify-between rounded-xl border border-[#2a2622] bg-[#0d0c0b] p-2.5 hover:border-[#f5a623]/40 transition"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="h-10 w-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`h-2 w-2 rounded-full shrink-0 ${
                                  dish.type === 'Veg' ? 'bg-[#00a651]' : 'bg-[#e53935]'
                                }`}
                              />
                              <p className="truncate font-bold text-white">{dish.name}</p>
                            </div>
                            <p className="text-[11px] font-mono font-bold text-[#f5a623]">₹{dish.price}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onAddToCart(dish, 1, '')}
                          className="flex items-center gap-1 rounded-lg bg-[#2a2622] px-3 py-1.5 text-[11px] font-black text-white hover:bg-[#f5a623] hover:text-black transition cursor-pointer active:scale-95 shrink-0"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Direct Water Ordering Card */}
                {m.waterCard && (
                  <div className="mt-2.5 w-full grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onAddWater('Normal');
                        pushMessage({ sender: 'bot', text: 'Added 1x Normal Water (₹10) to cart.' });
                      }}
                      className="p-3 rounded-xl border border-[#2a2622] bg-[#1b1816] hover:border-sky-500/50 text-left transition cursor-pointer"
                    >
                      <Droplet className="h-4 w-4 text-sky-400 mb-1" />
                      <p className="font-bold text-white text-xs">Room Temp</p>
                      <p className="text-[10px] text-zinc-400">₹10 / bottle</p>
                      <span className="mt-2 block text-[10px] font-bold text-[#f5a623]">+ Add to Cart</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onAddWater('Chilled');
                        pushMessage({ sender: 'bot', text: 'Added 1x Chilled Water (₹12) to cart.' });
                      }}
                      className="p-3 rounded-xl border border-[#2a2622] bg-[#1b1816] hover:border-sky-500/50 text-left transition cursor-pointer"
                    >
                      <Droplet className="h-4 w-4 text-sky-300 mb-1" />
                      <p className="font-bold text-white text-xs">Chilled Cold</p>
                      <p className="text-[10px] text-zinc-400">₹12 / bottle</p>
                      <span className="mt-2 block text-[10px] font-bold text-[#f5a623]">+ Add to Cart</span>
                    </button>
                  </div>
                )}

                {/* Live Running Bill Card */}
                {m.billCard && (
                  <div className="mt-2.5 w-full rounded-xl border border-[#2a2622] bg-[#1b1816] p-3 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#2a2622]">
                      <span className="text-[11px] font-bold text-zinc-400">Cart Summary</span>
                      <span className="text-[10px] text-zinc-500">{cart.length} items</span>
                    </div>

                    {cart.length === 0 && normalWaterQty === 0 && chilledWaterQty === 0 ? (
                      <p className="text-zinc-500 text-[11px] italic py-1">Your cart is empty.</p>
                    ) : (
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1 text-[11px]">
                        {cart.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-zinc-300">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-mono text-zinc-400">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        {normalWaterQty > 0 && (
                          <div className="flex justify-between text-sky-400">
                            <span>{normalWaterQty}x Normal Water</span>
                            <span>₹{normalWaterQty * 10}</span>
                          </div>
                        )}
                        {chilledWaterQty > 0 && (
                          <div className="flex justify-between text-sky-400">
                            <span>{chilledWaterQty}x Chilled Water</span>
                            <span>₹{chilledWaterQty * 12}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#2a2622] space-y-1 text-[11px]">
                      <div className="flex justify-between text-zinc-400">
                        <span>GST (5%)</span>
                        <span>₹{gst}</span>
                      </div>
                      <div className="flex justify-between font-bold text-white text-xs pt-1">
                        <span>Running Total</span>
                        <span className="text-[#f5a623]">₹{grandTotal}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Action Pills */}
                {m.options && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAction(opt.action, opt.label)}
                        className="rounded-full border border-[#2a2622] bg-[#1b1816] px-3 py-1.5 text-[11px] font-bold text-[#f5a623] hover:bg-[#2a2622] active:scale-95 cursor-pointer transition shadow-sm"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Input Form */}
          <form onSubmit={handleSend} className="flex gap-2 border-t border-[#2a2622] bg-[#1b1816] p-3">
            <input
              type="text"
              placeholder="Ask for spicy food, naan, water, or bill..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-xl border border-[#2a2622] bg-[#0d0c0b] px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-[#f5a623] outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#f5a623] px-3 py-2 text-black hover:bg-[#e0951a] cursor-pointer transition active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>

    );
}