import { 
  CheckCircle2, 
  ChefHat, 
  Layers, 
  LayoutGrid, 
  LogOut, 
  Menu, 
  Utensils, 
  UtensilsCrossed, 
  X,
  Bell,
  UserPlus,
  CreditCard,
  Banknote,
  QrCode,
  Info,
  Plus,
  Power,
  Edit2
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { 
  fetchOrders, 
  fetchStaffList, 
  createStaffMember, 
  toggleStaffStatus, 
  fetchMenuItems,
  createMenuItem,
  updateMenuItem
} from "../services/api";
import { socket } from "../services/socket";

type Tab = "kds" | "inventory" | "tables" | "service" | "staff" | "waiter_order";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface OrderTicket {
  _id: string;
  orderId: string;
  tableNumber: string;
  items: OrderItem[];
  water?: {
    enabled: boolean;
    normalQty: number;
    chilledQty: number;
  };
  itemSubtotal: number;
  tax: number;
  grandTotal: number;
  status: "received" | "in_prep" | "ready" | "served" | "completed";
  paymentMethod: string;
  paymentStatus: string;
  createdAt?: string;
}

interface ServiceAlert {
  id: string;
  tableNumber: number;
  reason: string;
  timestamp: string;
  resolved: boolean;
}

interface MenuItemData {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  ingredients: string[];
  spiceLevel: "Mild" | "Medium" | "Hot";
  type: "Veg" | "Non-Veg";
  estimatedTime: string;
  isAvailable: boolean;
}

const CATEGORIES = [
  "Tandoor & Fire Starters",
  "American Hearth & Smokehouse",
  "Clay-Pot Curries & Gravies",
  "Dum Biryanis & Indian Breads",
  "American Sides & Comforts",
  "Desserts",
  "Drinks & Beverages"
];

export default function AdminPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("kds");
  const [orders, setOrders] = useState<OrderTicket[]>([]);
  const [serviceCalls, setServiceCalls] = useState<ServiceAlert[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);

  // Manager: Staff Management States
  const [staffList, setStaffList] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPass, setNewStaffPass] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("Waiter");
  const [staffMsg, setStaffMsg] = useState("");

  // Manager: Menu Item Add / Edit Modal States
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    category: CATEGORIES[0],
    price: 350,
    description: "",
    image: "",
    ingredients: "",
    spiceLevel: "Medium" as "Mild" | "Medium" | "Hot",
    type: "Veg" as "Veg" | "Non-Veg",
    estimatedTime: "15–20 min"
  });

  // Waiter: Manual Order Placement States
  const [waiterTable, setWaiterTable] = useState("T1");
  const [waiterCart, setWaiterCart] = useState<{ [itemId: string]: number }>({});
  const [waiterPaymentMethod, setWaiterPaymentMethod] = useState("Cash at Table");

  const storedAdmin = localStorage.getItem("admin");
  const token = localStorage.getItem("admin_token") || "";
  const admin = storedAdmin ? JSON.parse(storedAdmin) : { name: "Staff", role: "Waiter" };

  const navigate = useNavigate();

  const loadMenu = () => {
    fetchMenuItems()
      .then((data) => setMenuItems(data))
      .catch((err) => console.log("Menu fetch fallback:", err));
  };

  useEffect(() => {
    socket.emit("join_kitchen");

    fetchOrders()
      .then((data) => setOrders(data))
      .catch((err) => console.log("Orders fetch fallback:", err));

    loadMenu();

    socket.on("kitchen:new_order", ({ order }: { order: OrderTicket }) => {
      setOrders((prev) => [order, ...prev]);
    });

    socket.on("kitchen:order_updated", (updateOrder: OrderTicket) => {
      setOrders((prev) => prev.map((o) => (o.orderId === updateOrder.orderId ? updateOrder : o)));
    });

    socket.on("service:alert", (alert: { tableNumber: number; reason: string; timestamp: string }) => {
      const newCall: ServiceAlert = {
        id: `${Date.now()}-${alert.tableNumber}`,
        tableNumber: alert.tableNumber,
        reason: alert.reason || "Waiter Assistance Needed",
        timestamp: alert.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        resolved: false,
      };
      setServiceCalls((prev) => [newCall, ...prev]);
    });

    socket.on("menu:item_updated", ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      setMenuItems((prev) => prev.map((m) => (m.id === id ? { ...m, isAvailable } : m)));
    });

    socket.on("menu:catalog_updated", () => {
      loadMenu();
    });

    return () => {
      socket.off("kitchen:new_order");
      socket.off("kitchen:order_updated");
      socket.off("service:alert");
      socket.off("menu:item_updated");
      socket.off("menu:catalog_updated");
    };
  }, []);

  useEffect(() => {
    if (activeTab === "staff" && admin.role === "Manager" && token) {
      fetchStaffList(token)
        .then((data) => setStaffList(data))
        .catch((err) => console.log("Staff fetch error:", err));
    }
  }, [activeTab, admin.role, token]);

  const handleNextStatus = (orderId: string, currentStatus: string) => {
    const nextMap: Record<string, string> = {
      received: "in_prep",
      in_prep: "ready",
      ready: "served",
      served: "completed"
    };

    const nextStatus = nextMap[currentStatus];
    if (!nextStatus) return;

    socket.emit("order:update_status", { orderId, nextStatus });
  };

  const markServiceResolved = (id: string) => {
    setServiceCalls((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: true } : c)));
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createStaffMember(token, {
        name: newStaffName,
        password: newStaffPass,
        role: newStaffRole
      });
      setStaffList((prev) => [created, ...prev]);
      setNewStaffName("");
      setNewStaffPass("");
      setStaffMsg("Staff registered successfully!");
      setTimeout(() => setStaffMsg(""), 3000);
    } catch (err: any) {
      setStaffMsg(err.message);
    }
  };

  const handleToggleStaff = async (id: string) => {
    try {
      const res = await toggleStaffStatus(token, id);
      setStaffList((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isActive: res.isActive } : s))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle item availability
  const handleToggleAvailability = (item: MenuItemData) => {
    if (admin.role !== "Manager") return;
    const updatedStatus = !item.isAvailable;
    socket.emit("menu:toggle_item", { id: item.id, isAvailable: updatedStatus });
    setMenuItems((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, isAvailable: updatedStatus } : m))
    );
  };

  // Open modal to add a brand new item
  const openAddItemModal = () => {
    setEditingItemId(null);
    setItemForm({
      name: "",
      category: CATEGORIES[0],
      price: 350,
      description: "",
      image: "",
      ingredients: "",
      spiceLevel: "Medium",
      type: "Veg",
      estimatedTime: "15–20 min"
    });
    setItemModalOpen(true);
  };

  // Open modal to edit existing item
  const openEditItemModal = (item: MenuItemData) => {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description,
      image: item.image,
      ingredients: item.ingredients ? item.ingredients.join(", ") : "",
      spiceLevel: item.spiceLevel || "Medium",
      type: item.type,
      estimatedTime: item.estimatedTime || "15–20 min"
    });
    setItemModalOpen(true);
  };

  // Save add/edit submission
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItemId) {
        await updateMenuItem(token, editingItemId, itemForm);
      } else {
        await createMenuItem(token, itemForm);
      }
      setItemModalOpen(false);
      loadMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Waiter order submission
  const handleWaiterSubmitOrder = async () => {
    const selectedItems = Object.entries(waiterCart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const itemInfo = menuItems.find((m) => m.id === id)!;
        return {
          id: itemInfo.id,
          name: itemInfo.name,
          price: itemInfo.price,
          quantity: qty,
          notes: "Assisted by Floor Waiter"
        };
      });

    if (selectedItems.length === 0) {
      alert("Please add at least one dish.");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: waiterTable,
          items: selectedItems,
          water: { enabled: false, normalQty: 0, chilledQty: 0 },
          paymentMethod: waiterPaymentMethod
        })
      });

      if (res.ok) {
        alert(`Order fired to kitchen successfully for Table #${waiterTable}!`);
        setWaiterCart({});
        setActiveTab("kds");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCallsCount = serviceCalls.filter((c) => !c.resolved).length;
  const activeOrders = orders.filter((o) => o.status !== "completed");

  return (
    <div className="h-screen w-full overflow-hidden bg-[#0d0c0b] text-white select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-50 h-16 w-full border-b border-[#2a2622] bg-[#141210]/95 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#2a2622] bg-[#1b1816] text-zinc-400 transition-all hover:border-[#f5a623]/30 hover:text-[#f5a623]"
          >
            <X className={`h-5 w-5 absolute transition-all duration-300 ease-in-out ${sidebarOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0 pointer-events-none"}`} />
            <Menu className={`h-8 w-8 absolute transition-all duration-300 ease-in-out ${sidebarOpen ? "rotate-90 scale-50 opacity-0 pointer-events-none" : "rotate-0 scale-50 opacity-100"}`} />
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-[#f5a623]/30 bg-[#211b17] text-[#f5a623] shadow-[0_0_15px_rgba(245,166,35,0.2)]">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <span className="font-serif text-lg font-black tracking-wide text-white">
                Dine<span className="text-[#f5a623]">Flow</span>
              </span>
              <span className="block text-[10px] font-medium text-zinc-500">
                {admin.name} • <span className="text-[#f5a623] font-bold">{admin.role}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Framework */}
      <div className="relative h-[calc(100vh-4rem)] overflow-hidden">
        {/* Collapsible Sidebar */}
        <aside className={`absolute left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-[#2a2622] bg-[#141210] shadow-2xl transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="border-b border-[#2a2622] px-5 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Operations Navigation</p>
            <h2 className="mt-1 text-sm font-black text-white">{admin.role} Workspace</h2>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            <button
              type="button"
              onClick={() => { setActiveTab("kds"); setSidebarOpen(false); }}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-all ${activeTab === "kds" ? "border border-[#f5a623]/30 bg-[#211b17] text-[#f5a623]" : "border border-transparent text-zinc-400 hover:bg-[#1b1816] hover:text-white"}`}
            >
              <Layers className="h-5 w-5 shrink-0" />
              <span className="flex-1">Kitchen Board</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f5a623] px-1.5 text-[9px] font-black text-black">{activeOrders.length}</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("service"); setSidebarOpen(false); }}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-all ${activeTab === "service" ? "border border-[#f5a623]/30 bg-[#211b17] text-[#f5a623]" : "border border-transparent text-zinc-400 hover:bg-[#1b1816] hover:text-white"}`}
            >
              <Bell className="h-5 w-5 shrink-0" />
              <span className="flex-1">Service Alerts</span>
              {pendingCallsCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[9px] font-black text-white animate-pulse">{pendingCallsCount}</span>
              )}
            </button>

            {/* Waiter Only Feature */}
            {admin.role === "Waiter" && (
              <button
                type="button"
                onClick={() => { setActiveTab("waiter_order"); setSidebarOpen(false); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-all ${activeTab === "waiter_order" ? "border border-[#f5a623]/30 bg-[#211b17] text-[#f5a623]" : "border border-transparent text-zinc-400 hover:bg-[#1b1816] hover:text-white"}`}
              >
                <Plus className="h-5 w-5 shrink-0" />
                <span className="flex-1">Take Table Order</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => { setActiveTab("inventory"); setSidebarOpen(false); }}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-all ${activeTab === "inventory" ? "border border-[#f5a623]/30 bg-[#211b17] text-[#f5a623]" : "border border-transparent text-zinc-400 hover:bg-[#1b1816] hover:text-white"}`}
            >
              <UtensilsCrossed className="h-5 w-5 shrink-0" />
              <span className="flex-1">Menu & Stock</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("tables"); setSidebarOpen(false); }}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-all ${activeTab === "tables" ? "border border-[#f5a623]/30 bg-[#211b17] text-[#f5a623]" : "border border-transparent text-zinc-400 hover:bg-[#1b1816] hover:text-white"}`}
            >
              <LayoutGrid className="h-5 w-5 shrink-0" />
              <span className="flex-1">Floor Stations</span>
            </button>

            {/* Manager Only Feature */}
            {admin.role === "Manager" && (
              <button
                type="button"
                onClick={() => { setActiveTab("staff"); setSidebarOpen(false); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-all ${activeTab === "staff" ? "border border-[#f5a623]/30 bg-[#211b17] text-[#f5a623]" : "border border-transparent text-zinc-400 hover:bg-[#1b1816] hover:text-white"}`}
              >
                <UserPlus className="h-5 w-5 shrink-0" />
                <span className="flex-1">Staff Access</span>
              </button>
            )}
          </nav>
          <div className="border-t border-[#2a2822] p-3">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("admin");
                localStorage.removeItem("admin_token");
                navigate("/admin");
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-bold text-zinc-500 transition-all hover:border-rose-500/20 hover:bg-rose-950/20 hover:text-rose-300"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="absolute inset-0 z-30 bg-black/50 backdrop-blur-[2px]" />
        )}

        {/* Viewport Sections */}
        <main className="h-full w-full overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-5 sm:p-6 lg:p-8">
            
            {/* 1. KDS BOARD */}
            {activeTab === "kds" && (
              <section className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-[#2a2622] bg-[#141210] p-4">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Active Tickets</span>
                    <p className="mt-1 text-2xl font-black text-white">{activeOrders.length}</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-[#141210] p-4">
                    <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Pending Fire</span>
                    <p className="mt-1 text-2xl font-black text-amber-400">{orders.filter((o) => o.status === "received").length}</p>
                  </div>
                  <div className="rounded-xl border border-blue-500/20 bg-[#141210] p-4">
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">On Fire / Prep</span>
                    <p className="mt-1 text-2xl font-black text-blue-400">{orders.filter((o) => o.status === "in_prep").length}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-[#141210] p-4">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Ready for Table</span>
                    <p className="mt-1 text-2xl font-black text-emerald-400">{orders.filter((o) => o.status === "ready").length}</p>
                  </div>
                </div>

                {activeOrders.length === 0 ? (
                  <div className="p-16 text-center rounded-2xl border border-[#2a2622] bg-[#141210]">
                    <ChefHat className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-zinc-300">No active kitchen orders</h3>
                    <p className="text-xs text-zinc-600 mt-1">Live customer orders from table QR codes will appear here instantly.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {activeOrders.map((ticket) => (
                      <div
                        key={ticket.orderId}
                        className={`rounded-2xl border bg-[#141210] p-5 flex flex-col justify-between shadow-2xl transition-all ${
                          ticket.status === "received"
                            ? "border-amber-500/50"
                            : ticket.status === "in_prep"
                            ? "border-blue-500/50"
                            : "border-emerald-500/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-[#2a2622] pb-3 mb-3">
                            <div>
                              <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Order #{ticket.orderId}</span>
                              <h3 className="text-xl font-black text-white">Table #{ticket.tableNumber}</h3>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ticket.status === "received" ? "bg-amber-500/20 text-amber-400" : ticket.status === "in_prep" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                              {ticket.status}
                            </span>
                          </div>

                          <div className="space-y-2.5 py-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Items Ordered:</span>
                            {ticket.items.map((item, idx) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-[#181614] border border-[#2a2622]">
                                <div className="flex justify-between text-xs">
                                  <span className="font-bold text-zinc-100">
                                    <span className="text-[#f5a623] font-black mr-2">{item.quantity}x</span>
                                    {item.name}
                                  </span>
                                  <span className="text-zinc-400 font-bold">₹{item.price * item.quantity}</span>
                                </div>
                                {item.notes && (
                                  <div className="mt-1 flex items-start gap-1 text-[10px] text-amber-400/90 italic">
                                    <Info className="w-3 h-3 shrink-0 mt-0.5" />
                                    <span>Special: {item.notes}</span>
                                  </div>
                                )}
                              </div>
                            ))}

                            {ticket.water?.enabled && (ticket.water.normalQty > 0 || ticket.water.chilledQty > 0) && (
                              <div className="p-2.5 rounded-xl bg-[#181614] border border-[#2a2622] text-xs">
                                <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Packaged Water:</span>
                                {ticket.water.normalQty > 0 && (
                                  <div className="flex justify-between text-zinc-300">
                                    <span>{ticket.water.normalQty}x Room Temp Water</span>
                                    <span>₹{ticket.water.normalQty * 10}</span>
                                  </div>
                                )}
                                {ticket.water.chilledQty > 0 && (
                                  <div className="flex justify-between text-zinc-300">
                                    <span>{ticket.water.chilledQty}x Chilled Water</span>
                                    <span>₹{ticket.water.chilledQty * 12}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#2a2622] mt-3 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span>Subtotal</span>
                            <span>₹{ticket.itemSubtotal}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span>GST (5%)</span>
                            <span>₹{ticket.tax}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm font-black text-white pt-1 border-t border-[#2a2622]">
                            <span>Grand Total</span>
                            <span className="text-[#f5a623] text-base">₹{ticket.grandTotal}</span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-[#1b1816] border border-[#2a2622] text-xs font-semibold">
                            <span className="text-zinc-500 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                              {ticket.paymentMethod.includes("UPI") ? (
                                <QrCode className="w-3.5 h-3.5 text-[#f5a623]" />
                              ) : ticket.paymentMethod.includes("Card") ? (
                                <CreditCard className="w-3.5 h-3.5 text-[#f5a623]" />
                              ) : (
                                <Banknote className="w-3.5 h-3.5 text-[#f5a623]" />
                              )}
                              Payment Mode
                            </span>
                            <span className="text-zinc-200">{ticket.paymentMethod}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleNextStatus(ticket.orderId, ticket.status)}
                            className="w-full mt-2 py-2.5 rounded-xl bg-[#211b17] border border-[#2a2622] hover:bg-[#f5a623] hover:text-black font-bold text-xs transition cursor-pointer"
                          >
                            Mark as {ticket.status === "received" ? "Preparing" : ticket.status === "in_prep" ? "Ready" : "Served"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 2. TABLE SERVICE CALLS */}
            {activeTab === "service" && (
              <section className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Floor Assistance Desk</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Table Waiter Requests</h2>
                  <p className="text-xs text-zinc-500">Live service notifications triggered when diners click &ldquo;Call Service&rdquo;.</p>
                </div>

                {serviceCalls.length === 0 ? (
                  <div className="p-16 text-center border border-[#2a2622] rounded-2xl bg-[#141210]">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-zinc-300">All tables attended to</h3>
                    <p className="text-xs text-zinc-600 mt-1">No pending guest service alerts.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {serviceCalls.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-5 rounded-2xl border transition-all ${alert.resolved ? "border-[#2a2622] bg-[#141210]/60 opacity-50" : "border-amber-500/40 bg-[#1e1914] shadow-lg shadow-amber-500/5"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Assistance Call</span>
                            <h3 className="text-2xl font-black text-white">Table #{alert.tableNumber}</h3>
                          </div>
                          <span className="text-[10px] text-zinc-500">{alert.timestamp}</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-2">{alert.reason}</p>
                        <div className="mt-4 pt-3 border-t border-[#2a2622] flex justify-end">
                          {alert.resolved ? (
                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Attended
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => markServiceResolved(alert.id)}
                              className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition cursor-pointer"
                            >
                              Mark Attended
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 3. MENU & INVENTORY CONTROL (MANAGER FULL MODIFY & ADD DISH) */}
            {activeTab === "inventory" && (
              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5a623]">Catalog & Stock Operations</p>
                    <h2 className="mt-1 text-2xl font-black text-white">Menu Stock & Price Control</h2>
                    <p className="text-xs text-zinc-500">
                      {admin.role === "Manager"
                        ? "Add dishes, modify prices, edit descriptions, or toggle 86'd status. Customer screens update in real-time."
                        : "View-only mode: Only Managers have authority to toggle 86'd status or edit item pricing."}
                    </p>
                  </div>
                  {admin.role === "Manager" && (
                    <button
                      type="button"
                      onClick={openAddItemModal}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#e0961b] text-black font-bold text-xs transition cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Dish</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex gap-3 items-center justify-between ${
                        item.isAvailable
                          ? "bg-[#141210] border-[#2a2622]"
                          : "bg-[#1a1210] border-rose-500/40 opacity-70"
                      }`}
                    >
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${item.isAvailable ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                          {item.isAvailable ? "Available" : "Sold Out (86'd)"}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate mt-1">{item.name}</h4>
                        <span className="text-xs font-black text-[#f5a623]">₹{item.price}</span>
                      </div>

                      {admin.role === "Manager" ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditItemModal(item)}
                            className="p-2.5 rounded-xl border border-[#2a2622] bg-[#1b1816] text-zinc-300 hover:text-[#f5a623] hover:border-[#f5a623]/30 transition cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item)}
                            className={`p-2.5 rounded-xl border transition cursor-pointer ${
                              item.isAvailable
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                            }`}
                            title={item.isAvailable ? "Mark Sold Out" : "Mark Available"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-semibold italic">Locked</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. WAITER DIRECT ORDER TAKING TERMINAL (WAITER EXCLUSIVE) */}
            {activeTab === "waiter_order" && admin.role === "Waiter" && (
              <section className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5a623]">Waiter Assistance Station</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Manual Table Order Intake</h2>
                  <p className="text-xs text-zinc-500">Take and fire orders directly on behalf of guests who do not have a smartphone.</p>
                </div>

                <div className="p-5 rounded-2xl bg-[#141210] border border-[#2a2622] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Select Table</label>
                      <select
                        value={waiterTable}
                        onChange={(e) => setWaiterTable(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#f5a623]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                          <option key={num} value={`T${num}`}>Table #{num}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Settlement Method</label>
                      <select
                        value={waiterPaymentMethod}
                        onChange={(e) => setWaiterPaymentMethod(e.target.value)}
                        className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#f5a623]"
                      >
                        <option value="Cash at Table">Cash at Table</option>
                        <option value="Card Machine at Table (POS)">Card Machine at Table (POS)</option>
                        <option value="Instant UPI (Waiter QR)">Instant UPI</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Select Dishes:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto no-scrollbar pr-1">
                      {menuItems.filter((m) => m.isAvailable).map((item) => (
                        <div key={item.id} className="p-3 rounded-xl bg-[#181614] border border-[#2a2622] flex justify-between items-center">
                          <div>
                            <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                            <span className="text-[10px] text-[#f5a623]">₹{item.price}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setWaiterCart((prev) => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                              className="w-6 h-6 rounded bg-[#2a2622] text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{waiterCart[item.id] || 0}</span>
                            <button
                              type="button"
                              onClick={() => setWaiterCart((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                              className="w-6 h-6 rounded bg-[#f5a623] text-black text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleWaiterSubmitOrder}
                    className="w-full py-3 rounded-xl bg-[#f5a623] text-black font-black text-xs hover:bg-[#e0961b] transition cursor-pointer"
                  >
                    Fire Order to Kitchen
                  </button>
                </div>
              </section>
            )}

            {/* 5. TABLE FLOOR STATIONS */}
            {activeTab === "tables" && (
              <section className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5a623]">Live Seating Overview</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Restaurant Floor Stations</h2>
                  <p className="text-xs text-zinc-500">Live operational status across all 12 dining stations.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                    const tableOrder = orders.find((o) => o.tableNumber === `T${num}` && o.status !== "completed");
                    const hasCall = serviceCalls.some((c) => c.tableNumber === num && !c.resolved);
                    return (
                      <div
                        key={num}
                        className={`p-4 rounded-2xl border transition-all ${
                          hasCall
                            ? "border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-500/10"
                            : tableOrder
                            ? "border-[#f5a623] bg-[#1a1612]"
                            : "border-[#2a2622] bg-[#141210]"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-black text-white">Table #{num}</span>
                          <span className={`w-2.5 h-2.5 rounded-full ${hasCall ? "bg-rose-500 animate-ping" : tableOrder ? "bg-amber-500" : "bg-emerald-500"}`} />
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {hasCall ? "Waiter Assistance Paged" : tableOrder ? `Active (${tableOrder.status})` : "Ready for Guests"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 6. MANAGER-ONLY STAFF DESK */}
            {activeTab === "staff" && admin.role === "Manager" && (
              <section className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5a623]">Administrative Desk</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Staff Credential Registry</h2>
                  <p className="text-xs text-zinc-500">Create new staff logins with encrypted credentials and set access scopes.</p>
                </div>

                {staffMsg && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                    {staffMsg}
                  </div>
                )}

                <form onSubmit={handleCreateStaff} className="p-5 rounded-2xl border border-[#2a2622] bg-[#141210] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Staff Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#f5a623]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Initial Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={newStaffPass}
                      onChange={(e) => setNewStaffPass(e.target.value)}
                      className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#f5a623]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Role Permission</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#f5a623]"
                    >
                      <option value="Waiter">Waiter</option>
                      <option value="Head Chef">Head Chef</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-[#f5a623] text-black text-xs font-bold hover:bg-[#e0961b] transition cursor-pointer">
                    + Register Staff
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {staffList.map((st) => (
                    <div key={st._id} className="p-4 rounded-xl border border-[#2a2622] bg-[#141210] flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-white">{st.name}</h4>
                        <span className="text-[11px] text-[#f5a623]">{st.role}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleStaff(st._id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${st.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"}`}
                      >
                        {st.isActive ? "Active" : "Disabled"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </main>
      </div>

      {/* MANAGER ADD / EDIT MODAL */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setItemModalOpen(false)}>
          <div className="w-full max-w-lg bg-[#141210] border border-[#2a2622] rounded-2xl p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#2a2622] pb-3">
              <h3 className="text-base font-bold text-white">
                {editingItemId ? "Modify Menu Dish" : "Add New Culinary Dish"}
              </h3>
              <button type="button" onClick={() => setItemModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Dish Name</label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f5a623]"
                    placeholder="e.g. Garlic Tandoori Prawns"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                    className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f5a623]"
                    placeholder="450"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f5a623]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Dietary Type</label>
                  <select
                    value={itemForm.type}
                    onChange={(e) => setItemForm({ ...itemForm, type: e.target.value as "Veg" | "Non-Veg" })}
                    className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f5a623]"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f5a623] resize-none"
                  placeholder="Fresh charred chicken morsels infused with cloves..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Image URL (Unsplash or direct image)</label>
                <input
                  type="text"
                  value={itemForm.image}
                  onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                  className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f5a623]"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Ingredients (comma-separated)</label>
                  <input
                    type="text"
                    value={itemForm.ingredients}
                    onChange={(e) => setItemForm({ ...itemForm, ingredients: e.target.value })}
                    className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f5a623]"
                    placeholder="Paneer, Bell Peppers, Ghee"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Spice Level</label>
                  <select
                    value={itemForm.spiceLevel}
                    onChange={(e) => setItemForm({ ...itemForm, spiceLevel: e.target.value as "Mild" | "Medium" | "Hot" })}
                    className="w-full bg-[#1b1816] border border-[#2a2622] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f5a623]"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Medium">Medium</option>
                    <option value="Hot">Hot</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-[#f5a623] text-black font-bold text-xs hover:bg-[#e0961b] transition cursor-pointer"
              >
                {editingItemId ? "Save Changes" : "+ Add Dish to Menu"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
