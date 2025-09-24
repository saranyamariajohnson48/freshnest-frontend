import React, { useRef } from 'react';
import SalaryInvoice from './SalaryInvoice.jsx';

export default function SalaryInvoicePreview() {
  const printRef = useRef(null);

  const demoData = {
    business: {
      name: 'Freshnest',
      addressLines: ['123 Business Street', 'City, State 12345'],
      email: 'admin@freshnest.com',
      phone: '+1 (555) 123-4567'
    },
    invoice: {
      number: 'SAL-ABC123',
      date: '24/09/2025',
      dueDate: '24/09/2025'
    },
    staff: {
      fullName: 'John Smith',
      email: 'john.smith@company.com',
      employeeId: 'EMP001',
      phone: '+1 (555) 987-6543'
    },
    salary: {
      month: '2025-09',
      baseSalary: 50000,
      deductions: 2500,
      deductionReason: 'Late arrival penalty for 5 days',
      paidAmount: 47500
    },
    payment: {
      paymentId: 'pay_1234567890abcdef',
      paymentMethod: 'razorpay',
      paidAt: '2025-09-24T10:30:00Z'
    },
    admin: {
      name: 'Admin User',
      email: 'admin@freshnest.com'
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Salary Invoice Preview</h2>
            <p className="text-gray-600 mt-1">Professional salary invoice for Freshnest staff payments</p>
          </div>
          <div className="space-x-2">
            <button 
              onClick={handlePrint} 
              className="btn-responsive border border-gray-300 rounded-md px-4 py-2 bg-white hover:bg-gray-50"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
        
        <div ref={printRef} className="bg-white rounded-lg shadow-sm">
          <SalaryInvoice {...demoData} />
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Features:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Professional layout with Freshnest branding</li>
            <li>• Complete staff and salary details</li>
            <li>• Deduction tracking with reasons</li>
            <li>• Payment method and transaction ID</li>
            <li>• Admin processing information</li>
            <li>• Print-friendly design</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

