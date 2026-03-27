
const PHYSICAL_HEIGHT_INCHES = 11.7;

// Helper functions to map exact pixel coordinates from your image editor 
// to percentages so that it scales perfectly both on screen and on physical paper.
const xPx = (px: number) => `${(px / TEMPLATE_WIDTH) * 100}%`;
const yPx = (px: number) => `${(px / TEMPLATE_HEIGHT) * 100}%`;
const fontSizePx = (px: number) => `${(px / TEMPLATE_WIDTH) * 100}cqi`; 
// Using container query length (cqi) for perfectly scaled fonts relative to container width,
// fallback below is just rems or percentages. Let's stick to viewport/container math or fixed percentages.

/** 
 * Here you can define the precise pixel coordinates you measure from Photoshop/Figma 
 * on your autoworx-template.jpg.
 */
const PLACEMENTS = {
  // Nudged based on the physical print photo to line up with NAME and Date
  customerName: { x: 300, y: 800 },  // Lowered from 550 to hit the NAME line
  date: { x: 1900, y: 820 },         // Lowered to hit the Date line
  itemsTableStart: { x: 200, y: 1120 }, // Nudged slightly down to sit perfectly in the row
  rowHeight: 88, // Nudged up from 80 because the physical print showed text drifting downwards
  total: { x: 2050, y: 2400 }, // Moved up to match a typical total box (adjust if needed)
};

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface InvoiceData {
  customerName: string;
  date: string;
  items: InvoiceItem[];
  total: number;
}

interface InvoicePrinterOverlayProps {
  data?: InvoiceData;
}

// Dummy data for preview purposes
const defaultData: InvoiceData = {
  customerName: "Juan Dela Cruz",
  date: new Date().toLocaleDateString(),
  items: [
    { id: "1", description: "Brake Pad Replacement", quantity: 2, price: 1500.0 },
    { id: "2", description: "Synthetic Oil Change", quantity: 1, price: 850.0 },
  ],
  total: 3850.0,
};

export function InvoicePrinterOverlay({ data = defaultData }: InvoicePrinterOverlayProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Control Bar (Hidden when printing) */}
      <div className="print:hidden w-full max-w-4xl flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm text-gray-600">
          Previewing Invoice Overlay. The background image will disappear upon printing.
        </p>
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
        >
          Print to Form
        </button>
      </div>

      {/* 
        The Printable Area 
        On screen: Aspect ratio fits the template, scaled by max-width.
        On print: Exactly 8.5in x 11.7in (A4 / Letter crossover), no borders. 
      */}
      <div 
        className="relative bg-white shadow-xl print:shadow-none print:border-none border border-gray-300 mx-auto overflow-hidden text-black font-sans"
        style={{
          // Screen sizing
          width: "100%",
          maxWidth: "800px",
          aspectRatio: `${TEMPLATE_WIDTH} / ${TEMPLATE_HEIGHT}`,
          // Note: using container queries would allow scaling fonts easily
          containerType: "inline-size",
        }}
      >
        {/*
          1. The Target Background Image
          It will show on the screen to help you align exactly, but is hidden in print.
        */}
        <img
          src="/autoworx-template.jpg"
          alt="Template Blueprint"
          className="absolute inset-0 w-full h-full object-contain print:hidden z-0 pointer-events-none opacity-80"
        />

        {/* 2. The Dynamic Text Overlay (z-10 puts it above the image) */}
        <div className="absolute inset-0 z-10">
          
          {/* Customer Name */}
          <div
            className="absolute font-semibold tracking-wide"
            style={{ 
              top: yPx(PLACEMENTS.customerName.y), 
              left: xPx(PLACEMENTS.customerName.x),
              fontSize: "3cqi" // roughly 3% of container width (~76px at full sizes)
            }}
          >
            {data.customerName}
          </div>

          {/* Date */}
          <div
            className="absolute font-semibold tracking-wide"
            style={{ 
              top: yPx(PLACEMENTS.date.y), 
              left: xPx(PLACEMENTS.date.x),
              fontSize: "3cqi"
            }}
          >
            {data.date}
          </div>

          {/* Items List - Rendered absolute to the root container to avoid collapsing height issues */}
          {data.items.map((item, index) => {
            // Calculate absolute Y position from the very top of the image
            const topOffsetPct = yPx(PLACEMENTS.itemsTableStart.y + (index * PLACEMENTS.rowHeight));
            
            return (
              <div 
                key={item.id} 
                className="absolute flex items-center"
                style={{ 
                  top: topOffsetPct, 
                  left: xPx(PLACEMENTS.itemsTableStart.x),
                  width: xPx(TEMPLATE_WIDTH - PLACEMENTS.itemsTableStart.x * 2),
                  fontSize: "2.5cqi"
                }}
              >
                {/* 
                  Adjust these widths to match the physical columns on your paper!
                  Based on the physical print photo: Description is wider (~55%)
                */}
                <span className="w-[55%]">{item.description}</span>
                <span className="w-[9%] text-center">{item.quantity}</span>
                <span className="w-[9%] text-center">pcs</span>
                <span className="w-[13.5%] text-right font-medium pr-2">₱{item.price.toFixed(2)}</span>
                <span className="w-[13.5%] text-right font-medium pr-2">
                  ₱{(item.quantity * item.price).toFixed(2)}
                </span>
              </div>
            );
          })}

          {/* Total Amount */}
          <div
            className="absolute font-bold"
            style={{ 
              top: yPx(PLACEMENTS.total.y), 
              left: xPx(PLACEMENTS.total.x),
              fontSize: "3.5cqi"
            }}
          >
            ₱{data.total.toFixed(2)}
          </div>
          
        </div>
      </div>

      {/* Global Print Styles Configuration */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Force physical page dimensions and remove default printer margins/headers */
          @page {
            size: ${PHYSICAL_WIDTH_INCHES}in ${PHYSICAL_HEIGHT_INCHES}in;
            margin: 0 !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Ensure the component fills exactly the physical page size */
          .print\\:shadow-none {
            width: ${PHYSICAL_WIDTH_INCHES}in !important;
            height: ${PHYSICAL_HEIGHT_INCHES}in !important;
            max-width: none !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
          /* Ensure other UI elements are hidden globally */
          nav, header, footer, aside, .sidebar {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}} />
    </div>
  );
}
