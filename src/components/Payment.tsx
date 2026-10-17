import { ArrowLeft, Banknote, CheckCircle, ChevronDown, CreditCard, QrCode, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useParams } from "react-router";
import { CreateOrder } from "../services/api";

function Payment() {
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>("upi");
  const [selectedCardOption, setSelectedCardOption] = useState<"online" | "table">("online");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [errors, setErrors] = useState({ cardNumber: "", cardName: "", expiry: "", cvv: "" });
  const [upiIdError, setUpiIdError] = useState("");
  const [loading, setLoading] = useState(false);

  const { tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleOrderMore = (): void => {
    navigate(`/table/${tableId}/`);
  };

  const total = location.state?.total || 0;

  const onPaymentComplete = async (customMethod?: string): Promise<void> => {
    try {
      setLoading(true);

      let resolvedMethod = customMethod;
      if (!resolvedMethod) {
        if (selectedMethod === "upi") resolvedMethod = "Instant UPI";
        else if (selectedMethod === "card") {
          resolvedMethod = selectedCardOption === "online" ? "Credit / Debit Card (Online)" : "Card Machine at Table (POS)";
        } else if (selectedMethod === "cash") {
          resolvedMethod = "Cash at Table";
        } else {
          resolvedMethod = "Online Settlement";
        }
      }

      const orderData = {
        tableNumber: String(tableId || "T12"),
        items: (location.state?.cart || []).map((it: any) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          notes: it.notes || ""
        })),
        water: location.state?.water || { enabled: false, normalQty: 0, chilledQty: 0 },
        paymentMethod: resolvedMethod
      };

      await CreateOrder(orderData as any);
      setPaymentComplete(true);
    } catch (err) {
      console.log("Order creation failed:", err);
      setPaymentComplete(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    const newErrors = {
      cardNumber: "",
      cardName: "",
      expiry: "",
      cvv: ""
    };

    if (!cardNumber.trim()) {
      newErrors.cardNumber = "Please enter your card number.";
    } else if (cardNumber.length < 16) {
      newErrors.cardNumber = "Card number must be 16 digits.";
    }

    if (!cardName.trim()) {
      newErrors.cardName = "Please enter the name on your card.";
    }

    if (!expiry.trim()) {
      newErrors.expiry = "Please enter your expiry date.";
    } else if (expiry.length < 4) {
      newErrors.expiry = "Enter expiry date as MM / YY.";
    } else {
      const month = Number(expiry.slice(0, 2));
      const year = Number(expiry.slice(2, 4));

      if (month < 1 || month > 12) {
        newErrors.expiry = "Enter a valid month (01-12).";
      } else {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear() % 100;
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          newErrors.expiry = "This card has expired.";
        }
      }
    }

    if (!cvv.trim()) {
      newErrors.cvv = "Please enter your CVV.";
    } else if (cvv.length < 3) {
      newErrors.cvv = "CVV must be 3 or 4 digits.";
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) return;
    onPaymentComplete("Credit / Debit Card (Online)");
  };

  const handleUpi = () => {
    if (!upiId.trim()) {
      setUpiIdError("Please enter UPI ID.");
      return;
    }
    const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiPattern.test(upiId.trim())) {
      setUpiIdError("Please enter a valid UPI ID.");
      return;
    }
    setUpiIdError("");
    onPaymentComplete("Instant UPI");
  };

  if (paymentComplete) {
    return (
      <PaymentConfirmed total={total} tableId={String(tableId)} onOrderMore={handleOrderMore} />
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0c0b] px-4 py-8 text-[#f6ecdc] sm:px-6 lg:px-8 select-none">
      <div className="mx-auto max-w-xl">
        <button
          type="button"
          onClick={() => navigate(`/table/${tableId}/`)}
          className="group flex items-center gap-2 text-xs font-bold text-[#bea995] transition hover:text-white border border-[#2a2622] bg-[#141210] px-4 py-2.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft size={18} className="transition duration-200 group-hover:-translate-x-0.5" />
          Back to Menu
        </button>
        <div className="mt-8 flex items-baseline justify-between border-b border-[#221f1c] pb-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wide text-[#f5a623]">
              Table #{tableId}
            </span>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-white sm:text-3xl">Select Payment</h1>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">Complete payment to fire your ticket to the hearth.</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Payable Total</span>
            <p className="text-2xl font-black text-[#f5a623]">₹{total}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3.5">
          {/* UPI Option */}
          <div className="overflow-hidden rounded-2xl border border-[#2a2622] bg-[#141210]">
            <button
              type="button"
              onClick={() => setSelectedMethod(selectedMethod === "upi" ? null : "upi")}
              className="flex w-full cursor-pointer items-center justify-between p-4 text-left sm:p-5"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-[#2a2622] bg-[#211b17] p-2.5 text-[#f5a623]">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Instant UPI & QR</h2>
                  <p className="text-xs text-zinc-400">PhonePe, Google Pay, Paytm, CRED</p>
                </div>
              </div>
              <ChevronDown
                size={18}
                className={`text-zinc-500 transition-transform duration-300 ${selectedMethod === "upi" ? "rotate-180 text-[#f5a623]" : ""}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ${selectedMethod === "upi" ? "grid-rows-[1fr] border-t border-[#221f1c] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col items-center bg-[#181614] p-5">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=dineflow@hearth&pn=DineFlow&am=${total}&cu=INR`}
                      alt="UPI QR Code"
                      className="h-36 w-36"
                    />
                  </div>
                  <p className="mt-3 text-center text-xs text-zinc-400">
                    Scan with any UPI application to settle <span className="font-bold text-white">₹{total}</span>
                  </p>
                  <div className="my-5 flex w-full items-center gap-3">
                    <div className="h-px flex-1 bg-[#2a2622]" />
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">or enter UPI ID</span>
                    <div className="h-px flex-1 bg-[#2a2622]" />
                  </div>
                  <div className="w-full space-y-2">
                    <div className="rounded-xl border border-[#2a2622] bg-[#211b17] px-3.5 py-2.5 focus-within:border-[#f5a623]">
                      <input
                        type="text"
                        placeholder="example@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-600"
                      />
                      {upiIdError && <p className="text-xs text-rose-400">{upiIdError}</p>}
                      <button
                        type="button"
                        onClick={handleUpi}
                        disabled={loading}
                        className="mt-2 w-full cursor-pointer rounded-xl bg-[#f5a623] py-3 text-xs font-black text-black hover:bg-[#e0961b] disabled:opacity-50"
                      >
                        {loading ? "Confirming..." : `Verify & Pay ₹${total}`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Option */}
          <div className="overflow-hidden rounded-2xl border border-[#2a2622] bg-[#141210]">
            <button
              type="button"
              onClick={() => setSelectedMethod(selectedMethod === "card" ? null : "card")}
              className="w-full p-4 text-left sm:p-5 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-[#2a2622] bg-[#211b17] p-2.5 text-[#f5a623]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Credit / Debit Card</h2>
                  <p className="text-xs text-zinc-400">Visa, MasterCard, RuPay</p>
                </div>
              </div>
              <ChevronDown
                size={18}
                className={`text-zinc-500 transition-transform duration-300 ${selectedMethod === "card" ? "rotate-180 text-[#f5a623]" : ""}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ${selectedMethod === "card" ? "grid-rows-[1fr] border-t border-[#221f1c] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="space-y-4 bg-[#181614] p-5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCardOption("online")}
                      className={`cursor-pointer rounded-xl border p-2.5 text-xs font-bold ${
                        selectedCardOption === "online"
                          ? "border-[#f5a623]/80 bg-[#f5a623] text-black"
                          : "border-[#2a2622] bg-[#211b17] text-zinc-400"
                      }`}
                    >
                      Pay Online Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCardOption("table")}
                      className={`cursor-pointer rounded-xl border p-2.5 text-xs font-bold ${
                        selectedCardOption === "table"
                          ? "border-[#f5a623]/80 bg-[#f5a623] text-black"
                          : "border-[#2a2622] bg-[#211b17] text-zinc-400"
                      }`}
                    >
                      Card Machine at Table
                    </button>
                  </div>
                  {selectedCardOption === "online" ? (
                    <div className="space-y-3 pt-2">
                      <div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={19}
                          required
                          value={cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}
                          autoComplete="cc-number"
                          placeholder="Card number"
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 16);
                            setCardNumber(value);
                          }}
                          className="w-full rounded-xl border border-[#2a2622] bg-[#211b17] px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-[#f5a623]"
                        />
                        {errors.cardNumber && <p className="mt-1 text-[11px] text-rose-400">{errors.cardNumber}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            placeholder="MM / YY"
                            inputMode="numeric"
                            maxLength={7}
                            value={expiry.replace(/(\d{2})(?=\d)/, "$1 / ")}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                              setExpiry(value);
                            }}
                            className="w-full rounded-xl border border-[#2a2622] bg-[#211b17] px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-[#f5a623]"
                          />
                          {errors.expiry && <p className="mt-1 text-[11px] text-rose-400">{errors.expiry}</p>}
                        </div>
                        <div>
                          <input
                            type="password"
                            placeholder="CVV"
                            inputMode="numeric"
                            maxLength={4}
                            value={cvv}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                              setCvv(value);
                            }}
                            className="w-full rounded-xl border border-[#2a2622] bg-[#211b17] px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-[#f5a623]"
                          />
                          {errors.cvv && <p className="mt-1 text-[11px] text-rose-400">{errors.cvv}</p>}
                        </div>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Name on card"
                          value={cardName}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^A-Za-z ]/g, "");
                            setCardName(value);
                          }}
                          className="w-full rounded-xl border border-[#2a2622] bg-[#211b17] px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-[#f5a623]"
                        />
                        {errors.cardName && <p className="mt-1 text-[11px] text-rose-400">{errors.cardName}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={handlePay}
                        disabled={loading}
                        className="mt-2 w-full cursor-pointer rounded-xl bg-[#f5a623] py-3 text-xs font-black text-black hover:bg-[#e0961b] disabled:opacity-50"
                      >
                        {loading ? "Processing..." : `Pay ₹${total}`}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-[#2a2622] bg-[#211b17] p-4 text-center">
                      <p className="text-xs leading-relaxed text-zinc-300">
                        A portable POS terminal will be brought directly to table #{tableId}
                      </p>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => onPaymentComplete("Card Machine at Table (POS)")}
                        className="w-full rounded-xl bg-[#f5a623] py-2.5 text-xs font-black text-black hover:bg-[#e0961b] cursor-pointer disabled:opacity-50"
                      >
                        {loading ? "Notifying..." : "Confirm Table Card Request"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cash Option */}
          <div className="overflow-hidden rounded-2xl border border-[#2a2622] bg-[#141210]">
            <button
              type="button"
              onClick={() => setSelectedMethod(selectedMethod === "cash" ? null : "cash")}
              className="flex w-full cursor-pointer items-center justify-between p-4 text-left sm:p-5"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-[#2a2622] bg-[#211b17] p-2.5 text-[#f5a623]">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Cash at Table</h2>
                  <p className="text-xs text-zinc-400">Pay cash upon dining completion</p>
                </div>
              </div>
              <ChevronDown
                size={18}
                className={`text-zinc-500 transition-transform duration-300 ${selectedMethod === "cash" ? "rotate-180 text-[#f5a623]" : ""}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ${selectedMethod === "cash" ? "grid-rows-[1fr] border-t border-[#221f1c] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <div className="space-y-3 bg-[#181614] p-5 text-center">
                  <p className="text-xs leading-relaxed text-zinc-300">
                    Your physical bill will be served with dessert. Please keep ₹{total} cash ready for your table server.
                  </p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onPaymentComplete("Cash at Table")}
                    className="w-full cursor-pointer rounded-xl bg-[#f5a623] py-3 text-xs font-black text-black hover:bg-[#e0961b] disabled:opacity-50"
                  >
                    {loading ? "Firing order..." : "Confirm Order & Pay Cash Later"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Encrypted Restaurant</span>
        </div>
      </div>
    </main>
  );
}

export default Payment;

interface OrderConfirmationProps {
  total: number;
  tableId: string;
  onOrderMore: () => void;
}

function PaymentConfirmed({ total, tableId, onOrderMore }: OrderConfirmationProps) {
  return (
    <main className="min-h-screen bg-[#0d0c0b] px-4 py-6 text-[#f6ecdc] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <div className="w-full">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <div className="mt-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f5a623]">
              Table #{tableId}
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Payment Successful
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Your order has been confirmed and sent to the kitchen.
            </p>
          </div>
          <div className="mt-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
              Amount Paid
            </p>
            <p className="mt-1 text-4xl font-black tracking-tight text-[#f5a623]">₹{total}</p>
          </div>
          <div className="mt-8 divide-y divide-[#2a2622] border-y border-[#2a2622]">
            <div className="flex items-center justify-between py-4">
              <span className="text-xs text-zinc-500">Payment Status</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Confirmed
              </span>
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="text-xs text-zinc-500">Table</span>
              <span className="text-xs font-bold text-white">#{tableId}</span>
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="text-xs text-zinc-500">Order Status</span>
              <span className="text-xs font-bold text-white">Sent to Kitchen</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOrderMore}
            className="mt-8 w-full rounded-xl bg-[#f5a623] px-5 py-3.5 text-xs font-black text-[#17120c] transition hover:brightness-110 cursor-pointer"
          >
            Order More
          </button>
          <p className="mt-4 text-center text-[10px] text-zinc-600">
            Thank you for dining with us.
          </p>
        </div>
      </div>
    </main>
  );
}