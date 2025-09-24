import React from 'react';

/**
 * Freshnest Invoice Component
 * A clean, print-friendly invoice inspired by the provided layout.
 *
 * Props:
 * - business: { name, addressLines: string[], email?, phone? }
 * - invoice: { number, date, dueDate }
 * - billTo: { name, company?, addressLines: string[] }
 * - payTo: { bankName, accountName, accountNo }
 * - items: Array<{ description, unitPrice, qty }>
 * - taxPercent: number
 */
export default function InvoiceFreshnest({
  business,
  invoice,
  billTo,
  payTo,
  items,
  taxPercent = 0
}) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const tax = Math.round((subtotal * taxPercent) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white text-gray-800 p-8 print:p-12 shadow-sm print:shadow-none print:bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-px bg-gray-300 w-48 mb-6" />
          <h1 className="tracking-[0.4em] text-3xl font-light">INVOICE</h1>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">INVOICE NO:</div>
          <div className="text-sm font-medium">{invoice.number}</div>
          <div className="mt-2 text-xs text-gray-500">DATE: <span className="text-gray-700">{invoice.date}</span></div>
          <div className="text-xs text-gray-500">DUE DATE: <span className="text-gray-700">{invoice.dueDate}</span></div>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-16">
        <div>
          <div className="uppercase text-xs tracking-widest text-gray-500 font-semibold">Issued to:</div>
          <div className="mt-3 text-sm">
            <div className="font-medium">{billTo.name}</div>
            {billTo.company && <div>{billTo.company}</div>}
            {billTo.addressLines?.map((ln, i) => (
              <div key={i}>{ln}</div>
            ))}
          </div>
        </div>
        <div>
          <div className="uppercase text-xs tracking-widest text-gray-500 font-semibold">Pay to:</div>
          <div className="mt-3 text-sm">
            <div className="font-medium">{payTo.bankName}</div>
            <div>Account Name: {payTo.accountName}</div>
            <div>Account No.: {payTo.accountNo}</div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="mt-12">
        <div className="grid grid-cols-12 text-xs font-semibold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2">
          <div className="col-span-6">Description</div>
          <div className="col-span-2 text-right">Unit Price</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Total</div>
        </div>
        {items.map((item, idx) => {
          const lineTotal = item.unitPrice * item.qty;
          return (
            <div key={idx} className="grid grid-cols-12 text-sm py-3 border-b border-gray-100">
              <div className="col-span-6">{item.description}</div>
              <div className="col-span-2 text-right">${item.unitPrice.toFixed(2)}</div>
              <div className="col-span-2 text-right">{item.qty}</div>
              <div className="col-span-2 text-right">${lineTotal.toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="mt-8 ml-auto w-64 text-sm">
        <div className="flex justify-between py-1">
          <div className="text-gray-600">Subtotal</div>
          <div className="font-medium">${subtotal.toFixed(2)}</div>
        </div>
        <div className="flex justify-between py-1">
          <div className="text-gray-600">Tax</div>
          <div className="font-medium">{taxPercent}%</div>
        </div>
        <div className="flex justify-between py-2 border-t mt-2">
          <div className="font-semibold tracking-wide">Total</div>
          <div className="font-semibold">${total.toFixed(2)}</div>
        </div>
      </div>

      {/* Footer / Signature */}
      <div className="mt-16 flex items-end justify-end">
        <div className="text-right">
          <div className="text-sm text-gray-500">{business?.name}</div>
          {business?.email && <div className="text-xs text-gray-400">{business.email}</div>}
          {business?.phone && <div className="text-xs text-gray-400">{business.phone}</div>}
        </div>
      </div>
    </div>
  );
}



