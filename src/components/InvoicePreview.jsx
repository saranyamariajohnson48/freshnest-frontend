import React, { useRef } from 'react';
import InvoiceFreshnest from './InvoiceFreshnest.jsx';

export default function InvoicePreview() {
  const printRef = useRef(null);

  const demoData = {
    business: {
      name: 'Freshnest',
      addressLines: ['123 Anywhere St., Any City'],
      email: 'billing@freshnest.app',
      phone: '+1 (555) 010-2000'
    },
    invoice: {
      number: '01234',
      date: '11.02.2030',
      dueDate: '11.03.2030'
    },
    billTo: {
      name: 'Richard Sanchez',
      company: 'Thynk Unlimited',
      addressLines: ['123 Anywhere St., Any City']
    },
    payTo: {
      bankName: 'Borcele Bank',
      accountName: 'Adeline Palmerston',
      accountNo: '0123 4567 8901'
    },
    items: [
      { description: 'Brand consultation', unitPrice: 100, qty: 1 },
      { description: 'Logo design', unitPrice: 100, qty: 1 },
      { description: 'Website design', unitPrice: 100, qty: 1 },
      { description: 'Social media templates', unitPrice: 100, qty: 1 },
      { description: 'Brand photography', unitPrice: 100, qty: 1 },
      { description: 'Brand guide', unitPrice: 100, qty: 1 }
    ],
    taxPercent: 10
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Invoice Preview</h2>
          <div className="space-x-2">
            <button onClick={handlePrint} className="btn-responsive border border-gray-300 rounded-md px-4 py-2 bg-white hover:bg-gray-50">
              Print / Save PDF
            </button>
          </div>
        </div>
        <div ref={printRef} className="bg-white">
          <InvoiceFreshnest {...demoData} />
        </div>
      </div>
    </div>
  );
}



