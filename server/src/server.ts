import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import mongoose, { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'hearth_charcoal_secret_key_8892';
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://22x51a3225_db_user:DineFlow2026@cluster0.drst1s8.mongodb.net/?appName=Cluster0';

// ---------------- TYPED DATABASE SCHEMAS & MODELS ----------------

export interface IStaff extends Document {
  name: string;
  password: string;
  role: 'Manager' | 'Head Chef' | 'Waiter';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Manager', 'Head Chef', 'Waiter'] },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);
const Staff = model<IStaff>('Staff', StaffSchema);

export interface IMenuItem extends Document {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  ingredients: string[];
  spiceLevel: 'Mild' | 'Medium' | 'Hot';
  type: 'Veg' | 'Non-Veg';
  estimatedTime: string;
  isAvailable: boolean;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    ingredients: [{ type: String }],
    spiceLevel: { type: String, enum: ['Mild', 'Medium', 'Hot'], default: 'Medium' },
    type: { type: String, enum: ['Veg', 'Non-Veg'], required: true },
    estimatedTime: { type: String, default: '15–20 min' },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);
const MenuItem = model<IMenuItem>('MenuItem', MenuItemSchema);

export interface IOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface IOrder extends Document {
  orderId: string;
  tableNumber: string;
  items: IOrderItem[];
  water: {
    enabled: boolean;
    normalQty: number;
    chilledQty: number;
  };
  itemSubtotal: number;
  tax: number;
  grandTotal: number;
  status: 'received' | 'in_prep' | 'ready' | 'served' | 'completed';
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    tableNumber: { type: String, required: true },
    items: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        notes: { type: String, default: '' }
      }
    ],
    water: {
      enabled: { type: Boolean, default: false },
      normalQty: { type: Number, default: 0 },
      chilledQty: { type: Number, default: 0 }
    },
    itemSubtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ['received', 'in_prep', 'ready', 'served', 'completed'],
      default: 'received'
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, default: 'completed' }
  },
  { timestamps: true }
);
const Order = model<IOrder>('Order', OrderSchema);

// ---------------- AUTH MIDDLEWARE ----------------

const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Token missing' });
    return;
  }
  try {
    (req as any).user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireManager = (req: Request, res: Response, next: NextFunction): void => {
  if ((req as any).user?.role !== 'Manager') {
    res.status(403).json({ error: 'Manager access required' });
    return;
  }
  next();
};

// ---------------- REST ROUTES ----------------

// Staff Login
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password } = req.body;
    const staff = await Staff.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true
    });

    if (!staff) {
      res.status(401).json({ error: 'Invalid admin name or password' });
      return;
    }

    const match = await bcrypt.compare(password, staff.password);
    if (!match) {
      res.status(401).json({ error: 'Invalid admin name or password' });
      return;
    }

    const token = jwt.sign(
      { id: staff._id, name: staff.name, role: staff.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      staff: { _id: staff._id, name: staff.name, role: staff.role }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Menu Items
app.get('/api/menu', async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await MenuItem.find({ isAvailable: true }).sort({ category: 1 });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Order
app.post('/api/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableNumber, items, water, paymentMethod } = req.body;

    const safeItems = items || [];
    const foodSubtotal = safeItems.reduce((sum: number, it: any) => sum + it.price * it.quantity, 0);
    const waterCost = (water?.normalQty || 0) * 10 + (water?.chilledQty || 0) * 12;
    const subtotal = foodSubtotal + waterCost;
    const tax = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + tax;

    const orderId = `DF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = await Order.create({
      orderId,
      tableNumber,
      items: safeItems,
      water,
      itemSubtotal: subtotal,
      tax,
      grandTotal,
      status: 'received',
      paymentMethod: paymentMethod || 'Instant UPI',
      paymentStatus: paymentMethod === 'Cash at Table' ? 'pending' : 'completed'
    });

    io.to('kitchen_console').emit('kitchen:new_order', { order: newOrder });

    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Active Orders
app.get('/api/orders/active', async (_req: Request, res: Response): Promise<void> => {
  try {
    const activeOrders = await Order.find({ status: { $ne: 'completed' } }).sort({ createdAt: -1 });
    res.json(activeOrders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Order Status
app.patch('/api/orders/:orderId/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const updated = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { status },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    io.to(`table:${updated.tableNumber}`).emit('order:status_changed', {
      orderId: updated.orderId,
      status: updated.status
    });
    io.to('kitchen_console').emit('kitchen:order_updated', updated);

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Service Call Route
app.post('/api/service-call', (req: Request, res: Response): void => {
  const { tableNumber, reason } = req.body;
  const payload = {
    tableNumber,
    reason: reason || 'Assistance requested at table',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  io.to('kitchen_console').emit('service:alert', payload);
  res.status(200).json({ success: true });
});

// Manager Staff Routes
app.get('/api/staff', verifyToken, requireManager, async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = await Staff.find({}, '-password').sort({ createdAt: -1 });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', verifyToken, requireManager, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password, role } = req.body;
    const existing = await Staff.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existing) {
      res.status(400).json({ error: 'Staff name already taken' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await Staff.create({ name, password: hashedPassword, role, isActive: true });
    res.status(201).json({ _id: created._id, name: created.name, role: created.role, isActive: created.isActive });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/staff/:id/toggle', verifyToken, requireManager, async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) {
      res.status(404).json({ error: 'Staff not found' });
      return;
    }
    member.isActive = !member.isActive;
    await member.save();
    res.json({ _id: member._id, isActive: member.isActive });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/menu", verifyToken, requireManager, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category, price, description, image, ingredients, spiceLevel, type, estimatedTime } = req.body;
    const id = `item-${Date.now()}`;
    const newItem = await MenuItem.create({
      id, name, category, price: Number(price), description, image: image || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80", ingredients: Array.isArray(ingredients) ? ingredients : (ingredients || "").split(",").map((s: string) => s.trim()),
      spiceLevel: spiceLevel || "Medium",
      type: type || "veg",
      estimatedTime: estimatedTime || "15-20 min",
      isAvailable: true
    });
    io.emit("menu:catalog_updated");
    res.status(201).json(newItem);
  } catch(err: any) {
      res.status(500).json({error: err.message});
  }
});

app.put("api/menu/:id", verifyToken, requireManager, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category, price, description, image, ingredients, spiceLevel, type, estimatedTime } = req.body;
    const updated = await MenuItem.findOneAndUpdate({id: req.params.id}, {
      name,
      category,
      price: Number(price),
      description,
      image,
      ingredients: Array.isArray(ingredients) ? ingredients : (ingredients || "").split(",").map((s: string) => s.trim()),
      spiceLevel,
      type,
      estimatedTime
    }, {new: true}
    );
    if(!updated) {
      res.status(404).json({error: "Item not found"});
      return;
    }
    io.emit("menu:catalog_updated");
    res.json(updated);
  } catch(err: any) {
    res.status(500).json({error: err.message});
  }
});

// ---------------- WEBSOCKETS ENGINE ----------------

io.on('connection', (socket: Socket) => {
  socket.on('join_table', (tableId: string) => {
    socket.join(`table:${tableId}`);
  });

  socket.on('join_kitchen', () => {
    socket.join('kitchen_console');
  });

  socket.on('order:update_status', async ({ orderId, nextStatus }) => {
    try {
      const updated = await Order.findOneAndUpdate({ orderId }, { status: nextStatus }, { new: true });
      if (updated) {
        io.to(`table:${updated.tableNumber}`).emit('order:status_changed', {
          orderId: updated.orderId,
          status: updated.status
        });
        io.to('kitchen_console').emit('kitchen:order_updated', updated);
      }
    } catch (err) {
      console.error('Error shifting status:', err);
    }
  });

  const broadcastServiceAlert = ({ tableNumber, reason }: { tableNumber: number; reason?: string }) => {
    io.to('kitchen_console').emit('service:alert', {
      tableNumber,
      reason: reason || 'Waiter assistance requested at table',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  socket.on('table:call_service', broadcastServiceAlert);
  socket.on('service:call', broadcastServiceAlert);

  socket.on('menu:toggle_item', ({ id, isAvailable }) => {
    io.emit('menu:item_updated', { id, isAvailable });
  });
});

// ---------------- DATABASE SEEDING ----------------

const seedDatabase = async () => {
  const staffCount = await Staff.countDocuments();
  if (staffCount === 0) {
    const salt = await bcrypt.genSalt(10);
    await Staff.create([
      { name: 'Tharun', password: await bcrypt.hash('12345@dev', salt), role: 'Head Chef' },
      { name: 'Kumar', password: await bcrypt.hash('1234@dev', salt), role: 'Manager' },
      { name: 'Nani', password: await bcrypt.hash('123@dev', salt), role: 'Waiter' }
    ]);
    console.log('🌱 Seeded default staff: Tharun (Head Chef), Kumar (Manager), Nani (Waiter)');
  }

  const menuCount = await MenuItem.countDocuments();
  if (menuCount === 0) {
    await MenuItem.insertMany([
      {
        id: "starters-1",
        name: "Murgh Malai Tikka",
        category: "Tandoor & Fire Starters",
        price: 460,
        description: "Tender chicken morsels marinated in rich clotted cream, green cardamom, and smoked over charcoal.",
        image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Chicken Thighs", "Heavy Cream", "Cashew Paste", "Green Cardamom", "Mace"],
        spiceLevel: "Mild",
        type: "Non-Veg",
        estimatedTime: "15–20 min"
      },
      {
        id: "starters-2",
        name: "Bhatti Ka Murgh",
        category: "Tandoor & Fire Starters",
        price: 490,
        description: "Robust bone-in chicken charred in an open clay pit with crushed coriander seeds and Kashmiri chilies.",
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Bone-in Chicken", "Mustard Oil", "Kashmiri Red Chili", "Crushed Coriander", "Black Pepper"],
        spiceLevel: "Hot",
        type: "Non-Veg",
        estimatedTime: "20–25 min"
      },
      {
        id: "starters-3",
        name: "Peshawari Paneer Tikka",
        category: "Tandoor & Fire Starters",
        price: 420,
        description: "Thick blocks of fresh cottage cheese skewered with charred bell peppers and mustard oil rub.",
        image: "https://images.unsplash.com/photo-1567184109191-37d6e8773950?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Fresh Paneer", "Hung Curd", "Mustard Oil", "Ajwain", "Bell Peppers"],
        spiceLevel: "Medium",
        type: "Veg",
        estimatedTime: "15–18 min"
      },
      {
        id: "starters-4",
        name: "Tandoori Soya Chaap",
        category: "Tandoor & Fire Starters",
        price: 380,
        description: "Layers of plant-based soya chaap steeped in spicy tandoori masala and seared over hardwood embers.",
        image: "https://images.unsplash.com/photo-1628294895950-9805252327bc?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Soya Chaap", "Yogurt", "Kashmiri Chili", "Garam Masala", "Chaat Masala"],
        spiceLevel: "Medium",
        type: "Veg",
        estimatedTime: "14–18 min"
      },
      {
        id: "starters-5",
        name: "Galouti Kebab with Mini Ulte Tawa Paratha",
        category: "Tandoor & Fire Starters",
        price: 540,
        description: "Melt-in-mouth smoked lamb patties infused with raw papaya and vetiver, served atop saffron griddled flatbreads.",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Minced Lamb", "Raw Papaya", "Brown Onion Paste", "Potli Masala", "Ghee"],
        spiceLevel: "Medium",
        type: "Non-Veg",
        estimatedTime: "18–22 min"
      },
      {
        id: "starters-6",
        name: "Amritsari Crispy Fish Fry",
        category: "Tandoor & Fire Starters",
        price: 520,
        description: "River sole goujons coated in spiced carom-scented gram flour batter, fried until golden and crisp.",
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
        ingredients: ["River Sole", "Besan (Gram Flour)", "Ajwain", "Amchur", "Ginger-Garlic Paste"],
        spiceLevel: "Medium",
        type: "Non-Veg",
        estimatedTime: "12–15 min"
      },
      {
        id: "starters-7",
        name: "Dahi Ke Kebab",
        category: "Tandoor & Fire Starters",
        price: 390,
        description: "Crispy pan-seared patties of strained hung yogurt, mild green chilies, and roasted coriander hearts.",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Hung Curd", "Paneer", "Roasted Cumin", "Green Chilies", "Panko Crust"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "12–16 min"
      },
      {
        id: "smokehouse-1",
        name: "Texas Smoked BBQ Chicken Wings",
        category: "American Hearth & Smokehouse",
        price: 450,
        description: "Slow-smoked jumbo chicken wings tossed in a sticky, sweet-tangy bourbon hickory glaze.",
        image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Jumbo Wings", "Hickory Smoke", "Bourbon BBQ Sauce", "Brown Sugar", "Ranch Dip"],
        spiceLevel: "Medium",
        type: "Non-Veg",
        estimatedTime: "15–20 min"
      },
      {
        id: "smokehouse-2",
        name: "Hickory-Smoked Pulled Lamb Sliders",
        category: "American Hearth & Smokehouse",
        price: 520,
        description: "Tender shredded lamb smoked for 10 hours, layered with apple cider vinegar slaw on toasted brioche buns.",
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Slow-Smoked Lamb", "Brioche Buns", "Crisp Slaw", "Pickles", "Chipotle Aioli"],
        spiceLevel: "Medium",
        type: "Non-Veg",
        estimatedTime: "14–18 min"
      },
      {
        id: "smokehouse-3",
        name: "Wood-Fired Smash Cheeseburger",
        category: "American Hearth & Smokehouse",
        price: 480,
        description: "Crisp-edged dual tenderloin patties with melted sharp cheddar, caramelized onions, and house burger sauce.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Minced Tenderloin", "Aged Cheddar", "Caramelized Onions", "Dill Relish", "Brioche Bun"],
        spiceLevel: "Mild",
        type: "Non-Veg",
        estimatedTime: "15–18 min"
      },
      {
        id: "smokehouse-4",
        name: "Slow-Cooked BBQ Ribs",
        category: "American Hearth & Smokehouse",
        price: 680,
        description: "Fall-off-the-bone tender ribs glazed with dark molasses and smoked over cherrywood.",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Choice Cut Ribs", "Dry Spice Rub", "Molasses BBQ Sauce", "Apple Cider Glaze"],
        spiceLevel: "Medium",
        type: "Non-Veg",
        estimatedTime: "20–25 min"
      },
      {
        id: "smokehouse-5",
        name: "Cajun Butter Garlic Grilled Prawns",
        category: "American Hearth & Smokehouse",
        price: 620,
        description: "Tiger prawns grilled directly over live coals and tossed in Louisiana Cajun herb butter.",
        image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Tiger Prawns", "Cajun Spice Blend", "Compound Garlic Butter", "Charred Lemon"],
        spiceLevel: "Hot",
        type: "Non-Veg",
        estimatedTime: "12–15 min"
      },
      {
        id: "smokehouse-6",
        name: "Classic Truffle & Parmesan Loaded Fries",
        category: "American Hearth & Smokehouse",
        price: 340,
        description: "Hand-cut skin-on Russet potato fries tossed in Italian white truffle oil and fresh shaved parmesan.",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Russet Potatoes", "White Truffle Oil", "Aged Parmesan", "Sea Salt", "Fresh Parsley"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "10–14 min"
      },
      {
        id: "smokehouse-7",
        name: "Nashville Hot Crisp Chicken Tenders",
        category: "American Hearth & Smokehouse",
        price: 420,
        description: "Extra crunchy buttermilk chicken strips basted in fiery cayenne lard oil, served with dill chips.",
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Chicken Tenderloins", "Buttermilk Batter", "Cayenne Pepper Sauce", "Dill Pickles"],
        spiceLevel: "Hot",
        type: "Non-Veg",
        estimatedTime: "12–16 min"
      },
      {
        id: "curries-1",
        name: "Old Delhi Butter Chicken",
        category: "Clay-Pot Curries & Gravies",
        price: 520,
        description: "Clay-oven roasted chicken simmered gently in a silky vine-ripened tomato gravy with cultured butter and fenugreek.",
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Tandoori Chicken", "San Marzano Tomatoes", "White Butter", "Kasuri Methi", "Fresh Cream"],
        spiceLevel: "Mild",
        type: "Non-Veg",
        estimatedTime: "15–20 min"
      },
      {
        id: "curries-2",
        name: "Dum Pukht Mutton Rogan Josh",
        category: "Clay-Pot Curries & Gravies",
        price: 580,
        description: "Kashmiri-style braised mutton shanks slow-cooked with aromatic ratan jot root and dry ginger broth.",
        image: "https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Mutton Shanks", "Fennel Powder", "Kashmiri Chili", "Ratan Jot", "Asafoetida"],
        spiceLevel: "Medium",
        type: "Non-Veg",
        estimatedTime: "20–25 min"
      },
      {
        id: "curries-3",
        name: "Paneer Tikka Masala",
        category: "Clay-Pot Curries & Gravies",
        price: 440,
        description: "Char-grilled cottage cheese cubes folded into a chunky tomato, onion, and bell pepper reduction.",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Grilled Paneer", "Onion-Tomato Masala", "Coriander Seeds", "Cream", "Bell Peppers"],
        spiceLevel: "Medium",
        type: "Veg",
        estimatedTime: "15–18 min"
      },
      {
        id: "curries-4",
        name: "Dal Makhani",
        category: "Clay-Pot Curries & Gravies",
        price: 380,
        description: "Whole black urad lentils slow-simmered over glowing charcoal for 24 hours with house churned butter.",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Black Lentils", "Kidney Beans", "Cultured Butter", "Tomato Puree", "Cream"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "10–15 min"
      },
      {
        id: "curries-5",
        name: "Kadhai Murgh",
        category: "Clay-Pot Curries & Gravies",
        price: 490,
        description: "Wok-tossed chicken chunks with cracked coriander, whole red chilies, and crunchy julienned bell peppers.",
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Chicken Chunks", "Crushed Coriander", "Dried Red Chilies", "Capsicum", "Onion Gravy"],
        spiceLevel: "Hot",
        type: "Non-Veg",
        estimatedTime: "16–20 min"
      },
      {
        id: "curries-6",
        name: "Methi Malai Matar",
        category: "Clay-Pot Curries & Gravies",
        price: 420,
        description: "Sweet garden peas and fresh bitter fenugreek leaves unified in a luscious cashew-onion ivory cream gravy.",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Fresh Green Peas", "Fenugreek Leaves", "Cashew Gravy", "Milk Cream", "Green Cardamom"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "15–18 min"
      },
      {
        id: "curries-7",
        name: "Yellow Dal Tadka with Ghee & Hing",
        category: "Clay-Pot Curries & Gravies",
        price: 320,
        description: "Homestyle arhar lentils finished with sizzling cow ghee, cumin seeds, garlic slivers, and fragrant asafoetida.",
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Arhar Dal", "Cow Ghee", "Hing (Asafoetida)", "Cumin", "Burnt Garlic"],
        spiceLevel: "Medium",
        type: "Veg",
        estimatedTime: "10–12 min"
      },
      {
        id: "rice-bread-1",
        name: "Hyderabadi Dum Gosht Biryani",
        category: "Dum Biryanis & Indian Breads",
        price: 590,
        description: "Long-grain aged basmati rice and marinated spring lamb slow-steamed under a sealed dough lid with pure saffron.",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Spring Lamb", "Aged Basmati Rice", "Kashmiri Saffron", "Caramelized Onions", "Mint Leaves"],
        spiceLevel: "Hot",
        type: "Non-Veg",
        estimatedTime: "20–25 min"
      },
      {
        id: "rice-bread-2",
        name: "Awadhi Dum Murgh Biryani",
        category: "Dum Biryanis & Indian Breads",
        price: 510,
        description: "Delicately spiced chicken cooked in fragrant yakhni broth, layered with saffron-infused rice and ittar essence.",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Chicken Thighs", "Basmati Rice", "Kewra Water", "Mace & Cardamom", "Ghee"],
        spiceLevel: "Medium",
        type: "Non-Veg",
        estimatedTime: "18–22 min"
      },
      {
        id: "rice-bread-3",
        name: "Jackfruit (Kathal) Dum Biryani",
        category: "Dum Biryanis & Indian Breads",
        price: 440,
        description: "Tender chunks of spiced raw jackfruit layered with aromatics and pot-sealed steamed basmati rice.",
        image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Raw Jackfruit", "Basmati Rice", "Yogurt Marinade", "Rose Water", "Brown Onions"],
        spiceLevel: "Medium",
        type: "Veg",
        estimatedTime: "16–20 min"
      },
      {
        id: "rice-bread-4",
        name: "Smoked Butter Garlic Naan",
        category: "Dum Biryanis & Indian Breads",
        price: 110,
        description: "Soft leavened refined flour bread baked inside the high-heat tandoor, brushed with roasted garlic and butter.",
        image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Refined Flour", "Minced Garlic", "Butter", "Fresh Coriander"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "6–8 min"
      },
      {
        id: "rice-bread-5",
        name: "Khurmi Chur-Chur Naan",
        category: "Dum Biryanis & Indian Breads",
        price: 140,
        description: "Flaky layered tandoori flatbread stuffed with spiced paneer and potatoes, hand-crushed with pure desi ghee.",
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Layered Dough", "Spiced Paneer", "Potato Mash", "Ajwain", "Desi Ghee"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "8–10 min"
      },
      {
        id: "rice-bread-6",
        name: "Tandoori Roti",
        category: "Dum Biryanis & Indian Breads",
        price: 60,
        description: "Traditional whole wheat bread slapped directly onto clay oven walls and charred over hardwood fire.",
        image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
        ingredients: ["100% Whole Wheat Flour", "Water", "Sea Salt"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "5–8 min"
      },
      {
        id: "rice-bread-7",
        name: "Laccha Paratha",
        category: "Dum Biryanis & Indian Breads",
        price: 90,
        description: "Multi-layered spiraled whole wheat bread roasted crisp with ghee until golden rings form.",
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Whole Wheat Dough", "Desi Ghee", "Chaat Masala Dust"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "6–9 min"
      },
      {
        id: "sides-1",
        name: "Skillet Baked Truffle Mac & Cheese",
        category: "American Sides & Comforts",
        price: 360,
        description: "Cavatappi pasta drenched in sharp cheddar and gruyère mornay sauce, finished with crispy panko breadcrumbs.",
        image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Cavatappi Pasta", "Aged Cheddar", "Gruyère", "Truffle Breadcrumbs", "Cream"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "12–15 min"
      },
      {
        id: "sides-2",
        name: "Charred Corn on the Cob with Herb Butter",
        category: "American Sides & Comforts",
        price: 240,
        description: "Sweet golden corn ears grilled over glowing embers, slathered in rosemary-chive compound butter and sea salt.",
        image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Sweet Corn", "Rosemary-Chive Butter", "Smoked Paprika", "Flaky Sea Salt"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "10–12 min"
      },
      {
        id: "sides-3",
        name: "Creamy Buttermilk Mashed Potatoes",
        category: "American Sides & Comforts",
        price: 260,
        description: "Whipped Yukon Gold potatoes with roasted garlic confit, churned buttermilk, and savory pepper gravy.",
        image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Yukon Gold Potatoes", "Buttermilk", "Roasted Garlic", "Fresh Chives"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "8–10 min"
      },
      {
        id: "sides-4",
        name: "Classic Southern Coleslaw",
        category: "American Sides & Comforts",
        price: 190,
        description: "Finely shredded purple and white cabbage with carrots folded into a tangy sweet-dill buttermilk dressing.",
        image: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Red & Green Cabbage", "Grated Carrots", "Apple Cider Mayo", "Celery Seeds"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "5–8 min"
      },
      {
        id: "sides-5",
        name: "Crispy Golden Onion Rings with Chipotle Mayo",
        category: "American Sides & Comforts",
        price: 260,
        description: "Colossal sweet onions dunked in craft beer batter, fried extra crisp and served with smoky chipotle dip.",
        image: "https://images.unsplash.com/photo-1639024471287-032f66705664?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Sweet White Onions", "Beer Batter", "Chipotle Chili Mayo", "Smoked Salt"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "10–12 min"
      },
      {
        id: "sides-6",
        name: "Wood-Fired Garlic Herb Cornbread",
        category: "American Sides & Comforts",
        price: 220,
        description: "Southern skillet cornbread baked over glowing coals, drizzled with hot honey and smoked sea salt butter.",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Yellow Cornmeal", "Whipped Butter", "Hot Honey", "Buttermilk", "Chives"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "10–12 min"
      },
      {
        id: "dessert-1",
        name: "Saffron Shahi Tukda with Rabdi",
        category: "Desserts",
        price: 280,
        description: "Crispy ghee-fried brioche steeped in saffron sugar syrup, blanketed with slow-reduced pistachio rabdi.",
        image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Brioche Bread", "Reduced Whole Milk (Rabdi)", "Kashmiri Saffron", "Pistachio Slivers"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "8–10 min"
      },
      {
        id: "dessert-2",
        name: "Warm Angoori Gulab Jamun with Vanilla Ice Cream",
        category: "Desserts",
        price: 260,
        description: "Miniature milk dumpling spheres soaked in warm rosewater syrup, paired with Madagascar vanilla bean ice cream.",
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Khoya", "Rose-Cardamom Syrup", "Vanilla Bean Ice Cream", "Almond Flakes"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "6–8 min"
      },
      {
        id: "dessert-3",
        name: "New York Style Baked Cheesecake with Berry Compote",
        category: "Desserts",
        price: 360,
        description: "Dense, velvety cream cheese filling over a buttery graham cracker crust, topped with wild berry coulis.",
        image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Philadelphia Cream Cheese", "Graham Cracker Crust", "Raspberry-Blueberry Compote", "Vanilla Extract"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "5–8 min"
      },
      {
        id: "dessert-4",
        name: "Molten Fire Chocolate Lava Cake",
        category: "Desserts",
        price: 340,
        description: "Warm Belgian dark chocolate cake with a flowing molten truffle center, dusted with Dutch cocoa powder.",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Belgian Dark Chocolate 70%", "Farm Butter", "Flour", "Pure Cocoa Powder"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "12–15 min"
      },
      {
        id: "drinks-1",
        name: "Smoked Masala Chaas",
        category: "Drinks & Beverages",
        price: 160,
        description: "Churned spiced buttermilk cold-smoked with charcoal and clove embers, garnished with crushed mint.",
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Churned Yogurt", "Roasted Cumin", "Charcoal Smoke", "Black Salt", "Fresh Mint"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "4–6 min"
      },
      {
        id: "drinks-2",
        name: "Alphonso Mango Lassi",
        category: "Drinks & Beverages",
        price: 210,
        description: "Thick beaten whole milk yogurt blended with Ratnagiri Alphonso mango pulp and crushed green cardamom.",
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Alphonso Mango Pulp", "Whole Milk Yogurt", "Cardamom Powder", "Pistachio Bits"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "4–6 min"
      },
      {
        id: "drinks-3",
        name: "Wood-Smoked Old Fashioned (Mocktail)",
        category: "Drinks & Beverages",
        price: 260,
        description: "Zero-proof barrel-aged bourbon notes infused with orange peel bitters and enveloped in aromatic hickory smoke.",
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Zero-Proof Bourbon Blend", "Angostura Style Bitters", "Charred Orange Peel", "Hickory Smoke"],
        spiceLevel: "Mild",
        type: "Veg",
        estimatedTime: "5–8 min"
      },
      {
        id: "drinks-4",
        name: "Charred Pineapple & Jalapeño Fizz",
        category: "Drinks & Beverages",
        price: 230,
        description: "Hardwood fire-roasted pineapple juice shaken with fresh jalapeño wheels, lime juice, and sparkling soda.",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
        ingredients: ["Charred Pineapple Purée", "Jalapeño Slices", "Fresh Lime", "Club Soda", "Tajín Rim"],
        spiceLevel: "Medium",
        type: "Veg",
        estimatedTime: "5–7 min"
      }
    ]);
    console.log('🌱 Seeded menu catalog in MongoDB Atlas');
  }
};

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(' Connected to MongoDB (dineflow)');
    await seedDatabase();
    server.listen(4000, () => {
      console.log('🚀 DineFlow Server running on http://localhost:4000');
    });
  })
  .catch((err) => {
    console.error(' MongoDB Connection Error:', err.message);
  });
