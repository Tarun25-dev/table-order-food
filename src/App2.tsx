import { useEffect, useState } from "react";
import { ItemDetailModal, CartDrawer, Water_Options, type MenuItem, type CartItem } from "./components/MenuItems";
import MenuGridWithExtras from "./components/MenuItems";
import { Info, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { DineBotDrawer } from "./components/DineBotDrawer";
import { useNotifications } from "./context/NotificationContext";
import { fetchMenuItems } from "./services/api";
import { socket } from "./services/socket";

export default function App2() {
  const [vegOnly, setVegOnly] = useState(false);
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [normalWaterQty, setNormalWaterQuantity] = useState(0);
  const [chilledWaterQty, setChilledWaterQuantity] = useState(0);
  const [wantsWater, setWaterWants] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const navigate = useNavigate();
  const { tableId } = useParams();
  const { addNotification } = useNotifications();

  // Fetch live dishes from MongoDB and listen for sold-out status updates
  useEffect(() => {
    fetchMenuItems()
      .then((data) => setMenuList(data))
      .catch((err) => console.log("Failed to load catalog from backend:", err));

    socket.on("menu:item_updated", ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      setMenuList((prev) => prev.map((item) => (item.id === id ? { ...item, isAvailable } : item)));
    });

    return () => {
      socket.off("menu:item_updated");
    };
  }, []);

  const addToCart = (item: MenuItem, quantity: number = 1, notes: string = "") => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((cartItem) => cartItem.id === item.id && cartItem.notes === notes);

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem.id === item.id && cartItem.notes === notes
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }
      return [
        ...currentCart,
        {
          ...item,
          quantity,
          notes,
        },
      ];
    });

    setTimeout(() => {
      const vegBadge = item.type === "Veg" ? "🌿 Pure Vegetarian" : "🍗 Hearth Meat";
      addNotification(
        `Added ${quantity}x ${item.name}`,
        `${vegBadge} dish placed into order ticket. Notes: ${notes || "Standard Preparation"}.`,
        "cart",
        210
      );
    }, 5);
  };

  const updateQuantity = (id: string, change: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + change } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const foodSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const waterTotal =
    normalWaterQty * Water_Options[0].price + chilledWaterQty * Water_Options[1].price;

  const subtotal = foodSubtotal + waterTotal;
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  return (
    <>
      <MenuGridWithExtras
        items={menuList}
        onSelectItem={setSelectedItem}
        onAddToCart={(item) => addToCart(item)}
        vegOnly={vegOnly}
        setVegOnly={setVegOnly}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />

      <DineBotDrawer
        menuItems={menuList}
        cart={cart}
        normalWaterQty={normalWaterQty}
        chilledWaterQty={chilledWaterQty}
        onAddWater={(type) => {
          setWaterWants(true);
          if (type === "Normal") {
            setNormalWaterQuantity((prev) => prev + 1);
          } else {
            setChilledWaterQuantity((prev) => prev + 1);
          }
        }}
        onAddToCart={(item) => addToCart(item)}
        onCallService={(reason) => console.log("Floor service alert:", reason)}
      />

      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={addToCart}
      />

      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onPlaceOrder={() => {
            setCartOpen(false);
            setShowConfirmation(true);
          }}
          normalWaterQty={normalWaterQty}
          setNormalWaterQuantity={setNormalWaterQuantity}
          chilledWaterQty={chilledWaterQty}
          setChilledWaterQuantity={setChilledWaterQuantity}
          wantsWater={wantsWater}
          setWaterWants={setWaterWants}
        />
      )}

      {showConfirmation && (
        <div className="fixed inset-0 z-100 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg max-h-[90vh] bg-[#141210] border border-[#2a2622] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2622] shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">Confirm Your Order</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Table #{tableId?.replace("T", "") || "12"} • Please review your order
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="w-8 h-8 rounded-full bg-[#211b17] border border-[#2a2622] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#2a2622] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Your Items</h3>
                  <span className="text-[10px] text-zinc-600">
                    {cart.length} {cart.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div
                    className="flex gap-3 p-3 rounded-xl bg-[#1b1816] border border-[#2a2622]"
                    key={`${item.id}-${item.notes}-${index}`}
                  >
                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-3">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.name}</h4>
                        <span className="text-xs font-black text-[#f5a623] shrink-0">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-500">
                          ₹{item.price} × {item.quantity}
                        </span>
                      </div>
                      {item.notes && (
                        <div className="flex items-start gap-1 mt-1.5">
                          <Info className="w-3 h-3 text-[#f5a623] shrink-0 mt-0.5" />
                          <span className="text-[10px] text-zinc-500">{item.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {wantsWater && (normalWaterQty > 0 || chilledWaterQty > 0) && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 px-1">Water</h3>
                  <div className="space-y-2">
                    {normalWaterQty > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#1b1816] border border-[#2a2622]">
                        <div>
                          <p className="text-xs font-bold text-white">{Water_Options[0].type}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            ₹{Water_Options[0].price} × {normalWaterQty}
                          </p>
                        </div>
                        <span className="text-xs font-black text-[#f5a623]">
                          ₹{normalWaterQty * Water_Options[0].price}
                        </span>
                      </div>
                    )}
                    {chilledWaterQty > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#1b1816] border border-[#2a2622]">
                        <div>
                          <p className="text-xs font-bold text-white">{Water_Options[1].type}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            ₹{Water_Options[1].price} × {chilledWaterQty}
                          </p>
                        </div>
                        <span className="text-xs font-black text-[#f5a623]">
                          ₹{chilledWaterQty * Water_Options[1].price}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#1b1816] border border-[#2a2622] space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>GST (5%)</span>
                  <span>₹{gst}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-[#2a2622]">
                  <span>Total</span>
                  <span className="text-[#f5a623]">₹{total}</span>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmation(false);
                    setCartOpen(true);
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#211b17] border border-[#2a2622] text-zinc-300 text-xs font-black hover:bg-[#2a2622] hover:text-white transition cursor-pointer"
                >
                  Back to Cart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmation(false);
                    navigate(`/table/${tableId}/payment`, {
                      state: {
                        total,
                        cart,
                        water: {
                          enabled: wantsWater,
                          normalQty: normalWaterQty,
                          chilledQty: chilledWaterQty,
                        },
                      },
                    });
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#f5a623] text-black text-xs font-black hover:brightness-110 transition cursor-pointer"
                >
                  Confirm Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}