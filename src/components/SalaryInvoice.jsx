import React from 'react';

/**
 * Salary Invoice Component for Freshnest
 * Specialized invoice for staff salary payments with admin details
 * 
 * Props:
 * - business: { name, addressLines: string[], email?, phone? }
 * - invoice: { number, date, dueDate }
 * - staff: { fullName, email, employeeId?, phone? }
 * - salary: { month, baseSalary, deductions, deductionReason, paidAmount }
 * - payment: { paymentId, paymentMethod, paidAt }
 * - admin: { name, email? } - Admin who processed the payment
 */
export default function SalaryInvoice({
  business,
  invoice,
  staff,
  salary,
  payment,
  admin
}) {
  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatMonth = (month) => {
    if (!month) return '—';
    const [year, monthNum] = month.split('-');
    const date = new Date(year, monthNum - 1);
    return date.toLocaleDateString('en-IN', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white text-gray-800 p-8 print:p-12 shadow-sm print:shadow-none print:bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-px bg-gray-300 w-48 mb-6" />
          <h1 className="tracking-[0.4em] text-3xl font-light">SALARY INVOICE</h1>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">INVOICE NO:</div>
          <div className="text-sm font-medium">{invoice.number}</div>
          <div className="mt-2 text-xs text-gray-500">DATE: <span className="text-gray-700">{invoice.date}</span></div>
          <div className="text-xs text-gray-500">PAYMENT DATE: <span className="text-gray-700">{formatDate(payment.paidAt)}</span></div>
        </div>
      </div>

      {/* Business Info */}
      <div className="mt-8">
        <div className="uppercase text-xs tracking-widest text-gray-500 font-semibold">From:</div>
        <div className="mt-2 text-sm">
          <div className="font-bold text-lg">{business.name}</div>
          {business.addressLines?.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {business.email && <div className="text-gray-600">{business.email}</div>}
          {business.phone && <div className="text-gray-600">{business.phone}</div>}
        </div>
      </div>

      {/* Staff Info */}
      <div className="mt-8">
        <div className="uppercase text-xs tracking-widest text-gray-500 font-semibold">Employee Details:</div>
        <div className="mt-3 text-sm">
          <div className="font-medium text-lg">{staff.fullName}</div>
          <div className="text-gray-600">{staff.email}</div>
          {staff.employeeId && <div className="text-gray-600">Employee ID: {staff.employeeId}</div>}
          {staff.phone && <div className="text-gray-600">Phone: {staff.phone}</div>}
        </div>
      </div>

      {/* Salary Details */}
      <div className="mt-12">
        <div className="grid grid-cols-12 text-xs font-semibold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2">
          <div className="col-span-6">Description</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-2 text-right">Deduction</div>
          <div className="col-span-2 text-right">Net Amount</div>
        </div>
        
        <div className="grid grid-cols-12 text-sm py-4 border-b border-gray-100">
          <div className="col-span-6">
            <div className="font-medium">Salary for {formatMonth(salary.month)}</div>
            {salary.deductionReason && (
              <div className="text-xs text-gray-500 mt-1">
                Deduction Reason: {salary.deductionReason}
              </div>
            )}
          </div>
          <div className="col-span-2 text-right font-medium">₹{salary.baseSalary.toLocaleString()}</div>
          <div className="col-span-2 text-right text-red-600 font-medium">
            {salary.deductions > 0 ? `-₹${salary.deductions.toLocaleString()}` : '₹0'}
          </div>
          <div className="col-span-2 text-right font-bold text-emerald-600">₹{salary.paidAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mt-8">
        <div className="uppercase text-xs tracking-widest text-gray-500 font-semibold mb-3">Payment Information:</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Payment Method:</div>
            <div className="font-medium capitalize">{payment.paymentMethod.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-gray-600">Transaction ID:</div>
            <div className="font-medium font-mono text-xs">{payment.paymentId || '—'}</div>
          </div>
        </div>
      </div>

      {/* Admin Details */}
      {admin && (
        <div className="mt-8">
          <div className="uppercase text-xs tracking-widest text-gray-500 font-semibold mb-3">Processed By:</div>
          <div className="text-sm">
            <div className="font-medium">{admin.name}</div>
            {admin.email && <div className="text-gray-600">{admin.email}</div>}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="mt-12 ml-auto w-64 text-sm">
        <div className="flex justify-between py-2 border-t-2 border-gray-300">
          <div className="font-bold text-lg tracking-wide">Total Paid</div>
          <div className="font-bold text-lg text-emerald-600">₹{salary.paidAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 flex items-end justify-between">
        <div className="text-sm text-gray-500">
          <div>This is a computer-generated salary invoice.</div>
          <div className="mt-1">For queries, contact: {business.email || business.phone}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">{business.name}</div>
          <div className="text-xs text-gray-400 mt-1">Authorized Signature</div>
        </div>
      </div>
    </div>
  );
}

