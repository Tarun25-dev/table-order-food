import { 
  Menu, 
  X, 
  ScanLine, 
  Utensils, 
  ArrowRight, 
  Sparkles, 
  Wheat, 
  Frame, 
  Clock, 
  ChefHat, 
  Flame, 
  Award, 
  Star, 
  ExternalLink, 
  Quote, 
  Sparkle, 
  Compass, 
  Wine, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Send, 
  ArrowUpRight, 
  CheckCircle2, 
  User, 
  Phone, 
  Users, 
  Calendar, 
  MessageSquareQuote 
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { useNavigate } from "react-router";
import DineFlowMenu from "./components/Menu";
import { BsInstagram } from "react-icons/bs";
import { FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

interface MenuItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  image: string;
  dietary: string[];
}

interface GalleryItem {
  id: string;
  type: "award" | "celebrity" | "moment";
  tag: string;
  title: string;
  subtitle: string;
  image: string;
  quote?: string;
  authorHandle?: string;
}

interface Review {
  id: number;
  name: string;
  role: string;
  rating: number;
  dish: string;
  date: string;
  comment: string;
}

const reviewData: Review[] = [
  {
    id: 1,
    name: 'Sophia Patel',
    role: 'Verified Diner',
    rating: 5,
    dish: 'Charred Herb Roasted Chicken',
    date: '2 weeks ago',
    comment:
      'The balance of garlic butter, fresh mountain rosemary, and live wood smoke was pure perfection. The atmosphere by the hearth makes you want to linger for hours.',
  },
  {
    id: 2,
    name: 'David Reynolds',
    role: 'Food Enthusiast',
    rating: 5,
    dish: 'Truffle Tenderloin Medallions',
    date: 'Last month',
    comment:
      'Easily the most memorable dinner of our entire year. Service was attentive without ever feeling intrusive, and the wine pairing was impeccably curated.',
  },
  {
    id: 3,
    name: 'Ananya Sharma',
    role: 'Local Guide',
    rating: 5,
    dish: 'Citrus-Glazed Wild Salmon',
    date: '3 weeks ago',
    comment:
      'Crisp wood-charred skin, tender salmon, and the saffron risotto was sublime. An unmatched destination for anniversaries and intimate gatherings.',
  },
  {
    id: 4,
    name: 'Julian Vance',
    role: 'Chef & Patron',
    rating: 5,
    dish: "Chef's Hearth Counter Tasting",
    date: '1 week ago',
    comment:
      'Sitting at the hearth counter and watching the brigade craft each course over raw embers was culinary theater at its absolute finest.',
  },
];

type InquiryType = "General" | "Private Dining" | "Chef Hearth" | " Press & Catering";

const previewItems: GalleryItem[] = [
  { id: "1", type: "award", tag: "Accolade", title: "Michelin Guide 2025", subtitle: "Best Culinary Experience Award", image: "/gallery1.png" },
  { id: "2", type: "celebrity", tag: "Social Highlight", title: "Chef Marcu Sterling", subtitle: "Food Critic & TV Host", quote: "'The grilled herb chicken at DineFlow is quite simply an unmatched standard of flavor balance.'", authorHandle: "@marcus_tastes", image: "/gallery2.png" },
  { id: "3", type: "moment", tag: "Milestone", title: "10th Anniversary Gala", subtitle: "Celebrating 100,000+ satisfied guests", image: "/gallery3.png" }
];

const signatureDishes: MenuItem[] = [
  { id: "1", name: "Charred Herb Roasted Chicken", tagline: "House Signature & Hearth-Cooked", description: "Slow-Charred Chicken breast marinated in wild rosemary, thyme, and garlic butter. Served over roasted seasonal vegetables and blistered vine tomatoes.", badge: "Chef's Choice", dietary: ['Gluten-Free', 'High Protien'], image: "/menuItem1.png" },
  { id: "2", name: "Pan-Seared Atlantic Salmon", tagline: "Wild-Caught & Citrus-Glazed", description: "Crisp skin filet rested on a bed of creamy saffron risotto, sauteed baby asparagus, and finished with a zesty preserved lemon-caper reduction.", badge: "Guest Favorite", dietary: ['Pescatarian', 'Omega-3 Rich'], image: "/menuItem2.png" },
  { id: "3", name: "Prime Truffle Tenderloin Medallions", tagline: "Dry-Aged 45 Days", description: "Cast-iron seared tenderloin cut served alongside potato mousseline, charred king oyester mushrooms, and an aromatic black truffle jus reduction", badge: "Signatures Cut", dietary: ['Signature Red Meat'], image: "/menuItem3.png" },
];

export default function App1() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollingDown, setScrollingDown] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanningRef = useRef(false);
  const [inquiryType, setInquiryType] = useState<InquiryType>("Private Dining");
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [formDataBook, setFormDataBook] = useState({ name: "", phone: "", guests: "2 Guests", date: "", time: "19:30", area: "Main Dining Room" });
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [currentIndex, setCurretIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const total = reviewData.length;
  const nextSlide = () => {
    setCurretIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    setCurretIndex((prev) => (prev - 1 + total) % total);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextSlide();
    }
    if (touchStartX.current - touchEndX.current < -50) {
      prevSlide();
    }
  };

  const inquiryPills: InquiryType[] = ["Private Dining", "Chef Hearth", "General", " Press & Catering"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const lastScroll = useRef(0);
  const navigate = useNavigate();

  const navLinks = [
    { name: "Home", href: "home", active: true },
    { name: "About", href: "about" },
    { name: "Gallery", href: "gallery" },
    { name: "Specialties", href: "specialties" },
    { name: "Contact", href: "contact" }
  ];

  const handleNavClick = (href: string) => {
    const section = document.getElementById(href);
    section?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  useEffect(() => {
    if (!scannerOpen) return;

    let isMounted = true;
    const startCamera = async (): Promise<void> => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera is unavailable");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err: unknown) {
        console.log(err);
        if (isMounted) {
          setError("Camera permission is required to scan.");
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [scannerOpen]);

  const closeScanner = (): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setError("");
    setScannerOpen(false);
  };

  useEffect(() => {
    if (!scannerOpen) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    scanningRef.current = true;
    const scan = () => {
      if (!scanningRef.current) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          console.log("QR detected", code.data);
          scanningRef.current = false;
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setScannerOpen(false);

          // Safe route handling for both full URLs and relative paths
          try {
            if (code.data.startsWith("http://") || code.data.startsWith("https://")) {
              const url = new URL(code.data);
              navigate(url.pathname);
            } else if (code.data.startsWith("/")) {
              navigate(code.data);
            } else {
              navigate(`/table/${code.data}`);
            }
          } catch {
            navigate(`/table/${code.data}`);
          }
          return;
        }
      }
      requestAnimationFrame(scan);
    };
    requestAnimationFrame(scan);

    return () => {
      scanningRef.current = false;
    };
  }, [scannerOpen, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll.current) {
        setScrollingDown(true);
      } else if (currentScroll < lastScroll.current) {
        setScrollingDown(false);
      }
      lastScroll.current = currentScroll;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleGallery = () => {
    window.open("/gallery", "_blank");
  };

  const specialties = [
    { icon: Flame, title: "Open Hearth Wood-Fire", highlight: "Charcoal & Smoked Oak", description: "We forgo conventional gas ranges in favor of live embers and seasoned hardwood, infusing every cut of meat and charred vegetables with deep, smoky undertone." },
    { icon: Sparkle, title: "48-Hour Signature Marinades", highlight: "Wild Rosemary & Herbs", description: "Our house poultry and cuts are steeped for two full days in cold-pressed garlic-oils, mountain thyme, secret spice rubs passed down through culinary tradition." },
    { icon: Compass, title: "Chef's Hearth Counter", highlight: "Front-Row Culinary Theater", description: "An intimate 8-seat counter facing the open kitchen where guests experience exclusive off-menu tastings, plate finishing, and interactive stories from our brigade." },
    { icon: Wine, title: "Artisanal Smoked Infusions", highlight: "Handcrafted Botanical Elixirs", description: "Zero-proof botanical reductions, cold-smoked orchard fruit blends, and cellar reserves designed specifically to harmonize with rich, hearth-grilled flavors." },
  ];

  const handleBookingModal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBookingSuccess(true);
  };

  const closeBookingModal = () => {
    setIsBookingOpen(false);
    setIsBookingSuccess(false);
  };

  const successCloseBookingModal = () => {
    setIsBookingOpen(false);
    setIsBookingSuccess(false);
    setFormDataBook({
      name: "",
      phone: "",
      guests: "2 Guests",
      date: "",
      time: "19:30",
      area: "Main Dining Room",
    });
  };

  return (
    <div>
      <section id="home" className="relative bg-[#F5F1E8] w-full font-sans overflow-hidden min-h-145 bg-no-repeat flex flex-col justify-between text-white lg:min-h-screen bg-cover bg-center">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/Main1.png')" }}>
          <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/40 to-transparent"></div>
        </div>
        <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-12 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Utensils className="w-6 h-6 text-white" strokeWidth={2.2} />
            <span className="text-2xl font-bold tracking-tight text-white">Dine<span className="text-[#e5a93b]">Flow</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-medium tracking-wide text-zinc-300">
            {navLinks.map((link) => (
              <button key={link.name} onClick={() => handleNavClick(link.href)} className={`cursor-pointer transition-colors duration-200 select-none ${link.active ? "text-[#f5a623] font-semibold" : "text-zinc-300 hover:text-white"}`}>{link.name}</button>
            ))}
            <button id="book" onClick={() => setIsBookingOpen(true)} className="px-5 py-2 select-none cursor-pointer rounded-full border border-[#f5a623]/80 text-[#f5a623] hover:bg-[#f5a623] hover:text-zinc-950 font-semibold text-xs tracking-wider uppercase transition-all duration-200">Book Table</button>
          </nav>
          <button type="button" onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-zinc-300 hover:text-white cursor-pointer" aria-label="Toggle menu">{isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          {isOpen && (
            <div className="absolute top-full left-6 z-50 right-6 mt-2 md:hidden overflow-hidden rounded-2xl border border-white/10 bg-[#20251f]/95 backdrop-blur-xl shadow-xl shadow-black/40">
              <nav className="flex flex-col p-2">
                {navLinks.map((link) => (
                  <button type="button" onClick={() => { handleNavClick(link.href); setIsOpen(false); }} key={link.name} className={`text-left mb-1 last:mt-1 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors ${link.active ? "bg-[#f5a623]/10 text-[#f5a623]" : "text-zinc-300 hover:bg-white/5 hover:text-white"}`}>{link.name}</button>
                ))}
                <div className="my-1 border-t border-white/10" />
                <button type="button" onClick={() => { setIsBookingOpen(true); setIsOpen(false); }} className="mt-1 px-4 py-3 rounded-xl bg-[#f5a623] text-center text-sm font-semibold text-zinc-950 hover:bg-[#e0951a] transition-colors">Book Table</button>
              </nav>
            </div>
          )}
        </header>
        <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 py-16 flex-1 flex flex-col justify-center items-start">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs tracking-wide text-zinc-300 mb-6">
              <span>Good Food</span>
              <span className="text-[#f5a623] font-bold">·</span>
              <span>Happy People</span>
              <span className="text-[#f5a623] font-bold">·</span>
              <span>Better Moments</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-[1.5px] w-12 bg-[#e5a93b]/80" />
              <span className="text-sm tracking-wide text-zinc-300 font-medium">Welcome to DineFlow</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">Great Food Brings <br /><span className="text-[#f5a623]">People Together</span></h1>
            <p className="text-base sm:text-lg text-zinc-300 max-w-md leading-relaxed mb-8">Explore our delicious menu, enjoy a seamless dining experience, and make every meal special.</p>
            <button type="button" onClick={() => { const MenuSection = document.getElementById("menu"); MenuSection?.scrollIntoView({ behavior: "smooth", block: "start" }) }} className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#f5a623] hover:bg-[#e0951a] text-zinc-950 font-semibold text-sm transition-all duration-200 transform hover:translate-x-1 shadow-lg shadow-black/30 cursor-pointer">
              <span>View Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
        <div className="h-8 relative z-10" />
      </section>

      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={closeBookingModal} />
          <div className="relative w-full max-w-lg rounded-3xl bg-[#141211] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden z-10 text-white">
            <div className="h-1 w-full bg-linear-to-r from-transparent via-[#f5a623] to-transparent" />
            <button type="button" onClick={closeBookingModal} className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-20"><X className="w-5 h-5" /></button>
            {!isBookingSuccess ? (
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623] text-xs font-semibold uppercase tracking-wider mb-2.5">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Table Reservation</span>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">Book Your Experience</h2>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">Reserve in advance to experience our hearth-cooked dining.</p>
                </div>
                <form onSubmit={handleBookingModal} className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-zinc-400 mb-1.5 font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#f5a623]" />Full Name</label>
                      <input type="text" required placeholder="Julian Ross" value={formDataBook.name} onChange={(e) => setFormDataBook({ ...formDataBook, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#f5a623]" />
                    </div>
                    <div>
                      <label className="flex text-zinc-400 mb-1.5 font-medium items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#f5a623]" />Phone Number</label>
                      <input type="tel" required placeholder="+1 (555) 000-0000" value={formDataBook.phone} onChange={(e) => setFormDataBook({ ...formDataBook, phone: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#f5a623]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="flex text-zinc-400 mb-1.5 font-medium items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#f5a623]" />Party Size</label>
                      <select value={formDataBook.guests} onChange={(e) => setFormDataBook({ ...formDataBook, guests: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#f5a623] cursor-pointer">
                        <option value="1 Guest">1 Guest</option>
                        <option value="2 Guests">2 Guests</option>
                        <option value="4 Guests">4 Guests</option>
                        <option value="6+ Guests">6+ Guests</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex text-zinc-400 mb-1.5 font-medium items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#f5a623]" />Date</label>
                      <input type="date" required value={formDataBook.date} onChange={(e) => setFormDataBook({ ...formDataBook, date: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#f5a623]" />
                    </div>
                  </div>
                  <div>
                    <label className="flex text-zinc-400 mb-1.5 font-medium items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#f5a623]" />Time Slot</label>
                    <select value={formDataBook.time} onChange={(e) => setFormDataBook({ ...formDataBook, time: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-[#f5a623] cursor-pointer">
                      <option value="17:30">5:30 PM</option>
                      <option value="19:30">7:30 PM</option>
                      <option value="20:45">8:45 PM</option>
                      <option value="21:30">9:30 PM</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full mt-3 py-2.5 rounded-full bg-[#f5a623] hover:bg-[#e0951a] text-zinc-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-black/40 cursor-pointer">Confirm Table Reservation</button>
                </form>
              </div>
            ) : (
              <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                <div className="p-3.5 bg-[#f5a623]/10 text-[#f5a623] rounded-full mb-4 border border-[#f5a623]/20">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-2">Reservation Confirmed!</h3>
                <p className="text-zinc-300 text-xs sm:text-sm max-w-sm mb-6 leading-relaxed">Thank you, <span className="font-semibold text-white">{formDataBook.name}</span>. Your table for <span className="text-[#f5a623]">{formDataBook.guests}</span> in the <span className="text-[#f5a623]">{formDataBook.area}</span> is reserved for <span className="text-[#f5a623]">{formDataBook.date || 'Your selected date'}</span> at {formDataBook.time}</p>
                <button type="button" onClick={successCloseBookingModal} className="px-8 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <button type="button" aria-label="Scan QR" onClick={() => { setError(""); setScannerOpen(true); }} className={`cursor-pointer fixed bottom-6 right-5 z-50 flex h-12 items-center overflow-hidden rounded-full bg-black text-white shadow-lg transition-[width, padding, gap] duration-700 ease-in-out hover:scale-105 hover:bg-[#2D342B] hover:shadow-xl ${scrollingDown ? "w-31.25 gap-2 px-4" : "w-12 justify-center"}`}><ScanLine size={21} strokeWidth={2} className="shrink-0" /><span className={`whitespace-nowrap overflow-hidden text-sm font-medium transition-all duration-500 ease-in-out text-[#C6A15B] ${scrollingDown ? "max-w-20 opacity-100" : "max-w-0 opacity-0"}`}>Scan QR</span></button>
      </div>

      {scannerOpen && (
        <div className="fixed p-4 flex items-end justify-center inset-0 z-50 bg-black/50">
          <div className="relative w-full max-w-sm h-105 sm:h-115 bg-[#211B17] rounded-3xl overflow-hidden shadow-2xl">
            <button onClick={closeScanner} className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-white/30"><X size={20} /></button>
            <div className="absolute top-6 left-0 right-0 text-center">
              <h2 className="text-[#f6ecdc] text-lg font-semibold">Scan QR Code</h2>
              <p className="text-[#f6ecdc] text-sm mt-1">Place the QR inside the frame</p>
            </div>
            <div className="absolute mt-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-55 h-55 sm:w-70 sm:h-70">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover"></video>
              <span className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#E6A95C] rounded-tl-xl" />
              <span className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#E6A95C] rounded-tr-xl" />
              <span className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#E6A95C] rounded-bl-xl" />
              <span className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#E6A95C] rounded-br-xl" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            {error && (
              <div className="absolute inset-0 z-10 flex items-center justify-center px-8 text-center">
                <p className="text-white text-sm">{error}</p>
              </div>
            )}
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
              <p className="text-[#f6ecdc] text-xs">Scan your restaurant QR code</p>
            </div>
          </div>
        </div>
      )}

      <section id="about" className="w-full bg-[#121110] text-white py-28 px-6 sm:px-12 relative overflow-hidden">
        <div className="absolute top-1/3 left-0 w-80 h-80 bg-[#f5a623]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative w-10/12 h-105 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                  <img src="/about1.png" alt="DineFlow warm dining room ambiance" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-linear-to-r from-black/60 via-transparent to-transparent" />
                </div>
                <div className="absolute -bottom-8 -right-2 sm:-right-4 w-7/12 h-64 sm:h-72 rounded-2xl overflow-hidden border-4 border-[#121110] shadow-2xl">
                  <img src="/about2.png" alt="Executive chef garnishing signature dish" className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-6 -left-3 sm:-left-6 bg-zinc-900/90 backdrop-blur-md border border-[#f5a623]/30 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#f5a623]/10 text-[#f5a623]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold">Established</span>
                    <span className="text-base font-extrabold text-white">15+ Years of Mastery</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-0.5 w-8 bg-[#f5a623]" />
                <span className="text-[#f5a623] text-xs uppercase tracking-widest font-semibold">About DineFlow</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] mb-6">Where Culinary Passion <br /><span className="text-[#f5a623]">Meets Timeless Hospitality</span></h2>
              <p className="text-zinc-300 text-base sm:text-lg leading-relaxed mb-6 font-normal">Born from a love for authentic wood-fired cooking and slow culinary craft, DineFlow is designed to be more than a resturant-it is a sanctuary where flavor, community, and unforgettable evenings converge.</p>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-8">Every morning begins with fresh hand-selected harvests from sustainable local farms, brought to life through seasoned charcoal fire, artisanal marinades, and an unyielding commitment to exceptional taste.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-[#f5a623]/30 transition-colors">
                  <Wheat className="w-5 h-5 text-[#f5a623] mb-2" />
                  <h4 className="text-sm font-bold text-white mb-1">Local & Organic</h4>
                  <p className="text-xs text-zinc-400">100% sustainable farm ingredients</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-[#f5a623]/30 transition-colors">
                  <Frame className="w-5 h-5 text-[#f5a623] mb-2" />
                  <h4 className="text-sm font-bold text-white mb-1">Live Hearth</h4>
                  <p className="text-xs text-zinc-400">Smoked & wood-fired culinary roots.</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-[#f5a623]/30 transition-colors">
                  <Clock className="w-5 h-5 text-[#f5a623] mb-2" />
                  <h4 className="text-sm font-bold text-white mb-1">Slow Cooked</h4>
                  <p className="text-xs text-zinc-400">Hours of reduction & flavor depth.</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div>
                  <h4 className="text-sm font-bold text-white">Alexander Vance</h4>
                  <span className="text-xs text-[#f5a623] font-medium">Founder & Master Culinary Director</span>
                </div>
                <div className="text-zinc-500 font-serif italic text-xl tracking-wider select-none">A. Vance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="w-full bg-[#171513] text-white py-24 px-6 sm:px-12 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-0.5 w-8 bg-[#f5a623]" />
              <ChefHat className="w-4 h-4 text-[#f5a623]" />
              <span className="text-[#f5a623] text-xs uppercase tracking-widest font-semibold">Culinary Signatures</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-1">Famous For Our Flavors</h2>
            <p className="text-zinc-400 max-w-md text-sm sm:text-base leading-relaxed">Every dish is crafted by our master chefs with locally sourced produce and thoughtful preparation.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            {signatureDishes.map((dish) => (
              <div key={dish.id} className="group rounded-2xl bg-zinc-900/60 border border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#f5a623]/40 transition-all duration-300 shadow-xl">
                <div className="relative h-60 w-full overflow-hidden">
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 text-xs font-semibold text-[#f5a623]">
                    <Flame className="w-3.5 h-3.5" /><span>{dish.badge}</span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#f5a623] font-medium block mb-1">{dish.tagline}</span>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#f5a623] transition-colors mb-3">{dish.name}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-5">{dish.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    {dish.dietary.map((tag) => (
                      <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/5 text-zinc-300 border border-white/5">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center select-none">
            <DineFlowMenu name='View Full Menu' className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#f5a623] hover:bg-[#e0951a] text-zinc-950 font-bold text-sm transition-all duration-300 shadow-lg shadow-black/40 group cursor-pointer" />
          </div>
        </div>
      </section>

      <section id="gallery" className="w-full bg-[#121110] text-white py-24 px-6 sm:px-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#f5a623]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-0.5 w-8 bg-[#f5a623]" />
              <span className="text-[#f5a623] text-xs uppercase tracking-wider font-semibold">Memories & Milestones</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Our Journey in the Spotlight</h2>
            <p className="text-zinc-400 max-w-md mt-2 text-sm sm:text-base leading-relaxed">Honored with prestigious awards and praised by culinary icons. Here is a brief look at the moments that define our story.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mt-4 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
              {previewItems.map((item) => (
                <div key={item.id} className="group relative rounded-2xl bg-zinc-900/60 border border-white/10 p-4 transition-all duration-300 hover:border-[#f5a623]/50 hover:-translate-y-1 flex flex-col justify-between overflow-hidden shadow-xl">
                  <div className="relative w-full h-64 rounded-xl overflow-hidden mb-5">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 text-xs font-medium text-[#f5a623]">
                      {item.type === "award" && <Award className="w-3.5 h-3.5" />}
                      {item.type === "celebrity" && <Star className="w-3.5 h-3.5" />}
                      {item.type === "moment" && <ExternalLink className="w-3.5 h-3.5" />}
                      <span>{item.tag}</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-[#f5a623] transition-colors mb-1">{item.title}</h3>
                      <p className="text-xs text-zinc-400 mb-3">{item.subtitle}</p>
                      {item.quote && (
                        <div className="relative bg-white/5 border border-white/5 rounded-xl p-3.5 mt-2 mb-2">
                          <Quote className="w-4 h-4 text-[#f5a623] mb-1.5 opacity-80" />
                          <p className="text-xs text-zinc-300 italic leading-relaxed">{item.quote}</p>
                          {item.authorHandle && (
                            <span className="block mt-2 text-[11px] font-medium text-[#f5a623]">{item.authorHandle}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full mb-10 flex items-center justify-end">
            <button type="button" onClick={handleGallery} className="px-4 flex items-center gap-2 py-3 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-[#f5a623] hover:text-zinc-950 hover:border-[#f5a623] text-zinc-200 font-semibold text-xs transition-all duration-300 shadow-md hover:translate-x-0.5 cursor-pointer">View More<ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      </section>

      <section id="specialties" className="w-full bg-[#121110] text-white py-24 px-6 sm:px-12 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-0.5 w-8 bg-[#f5a623]" />
                <span className="text-[#f5a623] text-xs uppercase tracking-wider font-semibold">What Sets Us Apart</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">Our Signature Craft</h2>
              <p className="text-zinc-400 max-w-md text-sm sm:text-base leading-relaxed">Beyond everyday dining, DineFlow is defined by ancient flame traditions, time-intensive preparation, and uncompromised culinary ritual.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {specialties.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="group p-6 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-[#f5a623]/40 hover:bg-zinc-900/90 transition-all duration-300 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center text-[#f5a623] mb-6 group-hover:bg-[#f5a623] group-hover:text-zinc-950 transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#f5a623] uppercase tracking-wider block mb-1">{item.highlight}</span>
                    <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-white/5 flex items-center gap-1.5 text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors">
                    <span>DineFlow Exclusive</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="reviews" className="w-full bg-[#121110] text-white py-24 px-6 sm:px-12 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-[#f5a623]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#f5a623] text-xs font-semibold uppercase tracking-wider mb-3">
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Guest Impressions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Stories From Our Hearth</h2>
            <p className="text-zinc-400 text-xs sm:text-sm">Rated <span className="text-[#f5a623] font-bold">4.9 / 5.0</span> across over 1,200 verified dining memories.</p>
          </div>
          <div className="relative" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <div className="overflow-hidden rounded-3xl">
              <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {reviewData.map((review) => (
                  <div key={review.id} className="w-full shrink-0 px-2 sm:px-4">
                    <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900/70 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-80">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-1 text-[#f5a623]">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-current" />
                            ))}
                          </div>
                          <span className="text-xs text-zinc-500 font-medium">{review.date}</span>
                        </div>
                        <p className="text-base sm:text-lg text-zinc-200 italic leading-relaxed mb-6 font-normal">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                      </div>
                      <div className="pt-6 border-t border-white/5 flex flex-col sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white tracking-wide">{review.name}</h4>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#f5a623]" />
                          </div>
                          <span className="text-xs text-zinc-400">{review.role}</span>
                        </div>
                        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-[#f5a623]">
                          <span className="text-zinc-400">Ordered:</span>
                          <span className="font-semibold">{review.dish}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              {reviewData.map((_, index) => (
                <button key={index} type="button" onClick={() => setCurretIndex(index)} aria-label={`Go to slide ${index + 1}`} className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentIndex === index ? "w-7 bg-[#f5a623]" : "w-2 bg-white/20 hover:bg-white/40"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="w-full bg-[#100e0d] text-white py-28 px-6 sm:px-12 relative overflow-hidden border-t border-white/5">
        <div className="absolute top-1/2 right-0 w-112.5 h-112.5 bg-[#f5a623]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-0.5 w-8 bg-[#f5a623]" />
              <span className="text-[#f5a623] text-xs uppercase tracking-wider font-semibold">Direct Concierge</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">Connect With DineFlow</h2>
            <p className="text-zinc-400 max-w-md text-sm sm:text-base leading-relaxed">Whether reserving our private hearth room, arranging bespoke wine pairings, or planning an intimate celebration, our team is here for you.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full rounded-full bg-[#f5a623] opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#f5a623]" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Kitchen & Concierge</h4>
                      <p className="text-[11px] text-zinc-400">Taking live calls & requests until 11:30 PM</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#f5a623] bg-[#f5a623]/10 px-3 py-1 rounded-full border border-[#f5a623]/20">Active</span>
                </div>
                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-6 sm:p-8 bg-linear-to-b from-zinc-900/90 to-zinc-950">
                  <div className="flex items-center gap-2 text-[#f5a623] text-xs font-bold uppercase tracking-wider mb-3">
                    <Wine className="w-4 h-4" />
                    <span>Exclusive Hire & Buyouts</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 leading-snug">Host Your Private Celebration</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">Our candlelit cellar room accommodates private gatherings of up to 35 guests with bespoke wood-fired menu curation from Chef Alexander Vance.</p>
                  <div className="space-y-3.5 border-t border-white/10 pt-5 text-xs text-zinc-300">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-[#f5a623]" />
                      <span>events@dineflow.com</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-[#f5a623]" />
                      <span>124 Grand Avenue, Suite 4B, New York</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <ShieldCheck className="w-4 h-4 text-[#f5a623]" />
                      Dedicated Event Manager Included
                    </span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 rounded-3xl bg-zinc-900/70 border border-white/10 p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Nature of Inquiry</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {inquiryPills.map((type) => (
                          <button type="button" key={type} onClick={() => setInquiryType(type)} className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${inquiryType === type ? "bg-[#f5a623] text-zinc-950 border-[#f5a623] shadow-md shadow-[#f5a623]/20" : "bg-zinc-800/60 border-white/5 text-zinc-300 hover:border-white/20 hover:text-white"}`}>{type}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Your Full Name *</label>
                        <input type="text" required placeholder="e.g. Julian Ross" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-white/10 focus:border-[#f5a623] focus:outline-none text-white text-sm transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Contact Number *</label>
                        <input type="tel" required placeholder="+1 (555) 000-0000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-white/10 focus:border-[#f5a623] focus:outline-none text-white text-sm transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Email Address *</label>
                        <input type="email" required placeholder="julian@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-white/10 focus:border-[#f5a623] focus:outline-none text-white text-sm transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Notes, Estimated Guest Count, or Custom Requests</label>
                        <textarea rows={4} required placeholder="Tell us about the occasion, preferred dates, or special dietary requirements.." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-white/10 focus:border-[#f5a623] focus:outline-none text-white text-sm transition-colors resize-none" />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-[#f5a623]" />
                        <span>Average reply within 2 hours</span>
                      </div>
                      <button type="submit" className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-full bg-[#f5a623] hover:bg-[#e0951a] text-zinc-950 font-bold text-sm tracking-wide transition-all duration-200 shadow-lg shadow-black/40 cursor-pointer">
                        <span>Transmit Inquiry</span>
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="p-3 bg-[#f5a623]/10 text-[#f5a623] rounded-full mb-4">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Inquiry Received</h3>
                    <p className="text-zinc-300 text-sm max-w-sm mb-6 leading-relaxed">Thank you, <span className="font-semibold text-white">{formData.name}</span>. Our dining coordinator has received your <span className="text-[#f5a623] font-medium">{inquiryType}</span> inquiry and will reach out promptly.</p>
                    <button type="button" onClick={() => setSubmitted(false)} className="px-6 py-2.5 rounded-full border border-white/20 text-white hover:bg-white/10 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer">Send Another Note</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full bg-[#0d0c0b] text-zinc-400 font-sans border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-10 items-start text-center md:text-left">
            <div className="lg:col-span-5 flex flex-col items-center md:items-start space-y-3">
              <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }) }} className="inline-flex items-center gap-2.5 group">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-[#f5a623]/50 transition-colors">
                  <Utensils className="w-4 h-4 text-[#f5a623]" strokeWidth={2.2} />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">Dine <span className="text-[#f5a623]">Flow</span></span>
              </button>
              <p className="text-xs sm:text-sm text-zinc-400 italic max-w-sm leading-relaxed">&ldquo;Crafted over live embers, savored in good company.&rdquo;</p>
            </div>
            <div className="lg:col-span-4 flex flex-col items-center md:items-start">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5">Explore</h4>
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm w-full max-w-xs md:max-w-none justify-center">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <button onClick={() => handleNavClick(link.href)} className="text-zinc-400 cursor-pointer hover:text-[#f5a623] transition-colors duration-200 inline-block py-0.5">{link.name}</button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => navigate("/admin")} className="text-zinc-400 cursor-pointer hover:text-[#f5a623] transition-colors duration-200 inline-block py-0.5">Admin</button>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-3 flex flex-col items-center md:items-start gap-5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Experience</h4>
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full max-w-xs sm:max-w-sm md:max-w-none">
                <button onClick={() => { const bookBtn = document.getElementById("book"); bookBtn?.scrollIntoView({ behavior: "smooth" }) }} className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#f5a623] hover:bg-[#e0951a] text-zinc-950 font-bold text-xs tracking-wide transition-all duration-200 shadow-sm cursor-pointer">
                  <span>Book a Table</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { const menuSection = document.getElementById("menu"); menuSection?.scrollIntoView({ behavior: "smooth" }) }} className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#f5a623] hover:bg-[#e0951a] text-zinc-950 font-bold text-xs tracking-wide transition-all duration-200 shadow-sm cursor-pointer">
                  <span>Explore Menu</span>
                </button>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-full bg-white/5 border border-white/5 text-zinc-300 hover:text-zinc-950 hover:bg-[#f5a623] hover:border-[#f5a623] transition-all duration-200">
                  <BsInstagram className="w-4 h-4" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-full bg-white/5 border border-white/5 text-zinc-300 hover:text-zinc-950 hover:bg-[#f5a623] hover:border-[#f5a623] transition-all duration-200">
                  <FaFacebook className="w-4 h-4" />
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" className="p-2 rounded-full bg-white/5 border border-white/5 text-zinc-300 hover:text-zinc-950 hover:bg-[#f5a623] hover:border-[#f5a623] transition-all duration-200">
                  <FaXTwitter className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 bg-[#090808] py-5 px-6 sm:px-10 lg:px-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
            <p>© 2026 DineFlow. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <a href="/privacy" target="_blank" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
              <a href="/term" target="_blank" className="hover:text-zinc-300 transition-colors">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
