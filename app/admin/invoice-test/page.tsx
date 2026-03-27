"use client";

import React, { useState } from "react";
import { InvoicePrinterOverlay, InvoiceData, InvoiceItem } from "@/components/admin/invoice-printer-overlay";

export default function InvoiceTestPage() {
  const [formData, setFormData] = useState<InvoiceData>({
    customerName: "Juan Dela Cruz",
    date: new Date().toLocaleDateString(),
    items: [
      { id: "1", description: "Brake Pad Replacement", quantity: 2, price: 1500.0 },
      { id: "2", description: "Synthetic Oil Change", quantity: 1, price: 850.0 },
    ],
    total: 3850.0,
  });

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setFormData((prev) => {
      const newItems = prev.items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      });
      const newTotal = newItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      return { ...prev, items: newItems, total: newTotal };
    });
  };

  const addItem = () => {
    setFormData((prev) => {
      const newItem: InvoiceItem = {
        id: Math.random().toString(),
        description: "New Item",
        quantity: 1,
        price: 0,
      };
      const newItems = [...prev.items, newItem];
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (id: string) => {
    setFormData((prev) => {
      const newItems = prev.items.filter((item) => item.id !== id);
      const newTotal = newItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      return { ...prev, items: newItems, total: newTotal };
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen p-8 bg-gray-50 max-w-[1600px] mx-auto">
      {/* Editor Panel - Hidden in Print */}
      <div className="w-full lg:w-[400px] flex-shrink-0 p-6 bg-white rounded-xl shadow-sm border border-gray-200 print:hidden overflow-y-auto max-h-[calc(100vh-4rem)]">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Invoice Editor</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input 
              type="text" 
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input 
              type="text" 
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Items</h3>
          <button 
            onClick={addItem}
            className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
          >
            + Add Line
          </button>
        </div>

        <div className="space-y-4">
          {formData.items.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg relative bg-gray-50 space-y-3">
              <button 
                onClick={() => removeItem(item.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-white rounded border border-red-200"
              >
                X
              </button>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input 
                  type="text" 
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded text-black"
                />
              </div>

              <div className="flex gap-2">
                <div className="w-1/3">
                  <label className="block text-xs text-gray-500 mb-1">Qty</label>
                  <input 
                    type="number" 
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border rounded text-black"
                  />
                </div>
                <div className="w-2/3">
                  <label className="block text-xs text-gray-500 mb-1">Price (₱)</label>
                  <input 
                    type="number" 
                    value={item.price}
                    onChange={(e) => handleItemChange(item.id, "price", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border rounded text-black"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t flex justify-between items-center px-2">
          <span className="font-semibold text-gray-700">Calculated Total:</span>
          <span className="text-xl font-bold bg-gray-100 p-2 rounded">₱{formData.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Preview Panel - Fully Visible during print */}
      <div className="flex-1 overflow-x-auto print:overflow-visible">
        <InvoicePrinterOverlay data={formData} />
      </div>
    </div>
  );
}
