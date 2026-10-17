import { useMemo, useState, useEffect } from "react";
import { fetchMenuItems } from "../services/api";
import type { MenuItem } from "./MenuItems";
import jsPDF from "jspdf";
import { Download, Utensils, X } from "lucide-react";

interface DineFlowMenuProps {
  name: string;
  className?: string;
}

export default function DineFlowMenu({ name, className = "" }: DineFlowMenuProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categoryNumber, setCategoryNumber] = useState(0);

  useEffect(() => {
    fetchMenuItems()
      .then((data) => setItems(data))
      .catch((err) => console.log("Failed to load menu for PDF/viewer:", err));
  }, []);

  // Groups all items dynamically by their category
  const groupedCategories = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    items.forEach((item) => {
      const cat = item.category || "Main Menu";
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(item);
    });

    return Array.from(map.entries()).map(([name, catItems]) => ({
      name,
      items: catItems,
    }));
  }, [items]);

  const currentCategory = groupedCategories[categoryNumber] || {
    name: "Menu",
    items: [],
  };

  const downloadMenuPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let y = 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.text("DINEFLOW", pageWidth / 2, y, { align: "center" });
    y += 8;

    pdf.setFontSize(9);
    pdf.text("Restaurant Menu", pageWidth / 2, y, { align: "center" });
    y += 12;

    groupedCategories.forEach((category) => {
      if (y > pageHeight - 45) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(category.name, margin, y);
      y += 8;

      pdf.setDrawColor(190, 185, 175);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      category.items.forEach((item) => {
        if (y > pageHeight - 25) {
          pdf.addPage();
          y = 20;
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(16);
          pdf.text(category.name, margin, y);
          y += 10;
        }

        const iconX = margin;
        const iconY = y - 3;
        pdf.setLineWidth(0.5);

        if (item.type === "Veg") {
          pdf.setDrawColor(50, 130, 70);
          pdf.setFillColor(50, 130, 70);
        } else {
          pdf.setDrawColor(160, 60, 50);
          pdf.setFillColor(160, 60, 50);
        }
        pdf.rect(iconX, iconY, 4, 4);
        pdf.circle(iconX + 2, iconY + 2, 1.2, "F");

        pdf.setTextColor(45, 45, 45);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(item.name, margin + 8, y);

        pdf.text(`Rs. ${item.price}`, pageWidth - margin, y, {
          align: "right",
        });

        pdf.setDrawColor(220, 215, 205);
        pdf.setLineWidth(0.2);
        pdf.line(margin + 8, y + 3, pageWidth - margin, y + 3);
        y += 10;
      });
      y += 6;
    });

    const totalPages = pdf.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      pdf.setPage(page);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text("The Green Leaf • DineFlow", margin, pageHeight - 10);
      pdf.text(
        `Page ${page} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      );
    }
    pdf.save("DineFlow-Menu.pdf");
  };

  return (
    <>
      <button
        onClick={() => {
          setCategoryNumber(0);
          setOpen(true);
        }}
        className={className}
      >
        {name}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
          <div className="relative flex h-[88vh] w-full max-w-4xl flex-col rounded-2xl bg-[#141210] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10 text-white">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#1a1715] px-5 py-3.5">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-[#f5a623] uppercase">
                  DineFlow Culinary Collection
                </p>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Menu Preview
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadMenuPDF}
                  className="flex items-center cursor-pointer gap-1.5 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-zinc-200 transition-all hover:bg-[#f5a623] hover:text-zinc-950 hover:border-[#f5a623]"
                >
                  <Download size={14} />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-zinc-400 transition-colors cursor-pointer hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/5 bg-[#171513] px-4 py-2.5 no-scrollbar">
              {groupedCategories.map((cat, idx) => (
                <button
                  key={cat.name}
                  onClick={() => setCategoryNumber(idx)}
                  className={`whitespace-nowrap rounded-full cursor-pointer px-3.5 py-1.5 text-xs tracking-wide font-medium transition-all ${
                    idx === categoryNumber
                      ? "bg-[#f5a623] text-zinc-950 shadow-sm shadow-[#f5a623]/20"
                      : "bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-3 ml-4">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 items-center justify-center rounded-xs border border-emerald-500">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs text-zinc-300">Veg</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 items-center justify-center rounded-xs border border-rose-500">
                  <span className="h-1 w-1 rounded-full bg-rose-500" />
                </span>
                <span className="text-xs text-zinc-300">Non-Veg</span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
              <div className="mb-4 flex items-baseline justify-between border-b border-white/10 pb-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {currentCategory.name}
                </h3>
                <span className="text-xs font-medium text-zinc-400">
                  {currentCategory.items.length} items
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {currentCategory.items.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="group flex gap-3.5 rounded-xl border border-white/5 bg-zinc-900/60 p-3 shadow-sm transition-all duration-300 hover:border-[#f5a623]/40 hover:bg-zinc-900/90 hover:shadow-md"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-500">
                          <Utensils size={24} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-xs border ${
                                item.type === "Veg" ? "border-emerald-600" : "border-rose-600"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  item.type === "Veg" ? "bg-emerald-600" : "bg-rose-600"
                                }`}
                              />
                            </span>
                            <h4 className="text-xs font-bold text-white group-hover:text-[#f5a623] transition-colors line-clamp-1">
                              {item.name}
                            </h4>
                          </div>
                        </div>

                        {item.description && (
                          <p className="mt-1 text-[11px] leading-snug text-zinc-400 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#f5a623]">
                          ₹{item.price}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
