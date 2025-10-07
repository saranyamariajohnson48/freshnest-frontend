import React, { useState } from 'react';
import { useToastContext } from '../contexts/ToastContext';

const fieldCls = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors";

const SupplierOnboardingPublic = () => {
  const { error, success } = useToastContext();
  const [form, setForm] = useState({
    companyName: '', supplierType: 'company', contactPerson: '', email: '', phone: '', address: '',
    gstNumber: '', tradeLicenseNo: '', bankAccountNumber: '', bankNameIfsc: '', identityProofType: '', identityProofUrl: '',
    productCategory: '', deliveryCapability: '', previousClients: '', declarationAccepted: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/supplier-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed');
      setDone(true);
      success('Application submitted successfully');
    } catch (err) {
      error('Submission failed. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-emerald-700">Thank you!</h1>
          <p className="text-gray-600 mt-2">Your Supplier Onboarding form has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Onboarding Form</h1>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Supplier Details</h2>
          <input className={fieldCls} name="companyName" placeholder="Company/Business Name" value={form.companyName} onChange={handleChange} required />
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="radio" name="supplierType" value="individual" checked={form.supplierType==='individual'} onChange={handleChange} /> Individual</label>
            <label className="flex items-center gap-2"><input type="radio" name="supplierType" value="company" checked={form.supplierType==='company'} onChange={handleChange} /> Company</label>
          </div>
          <input className={fieldCls} name="contactPerson" placeholder="Contact Person Name" value={form.contactPerson} onChange={handleChange} required />
          <input className={fieldCls} type="email" name="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
          <input className={fieldCls} name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
          <textarea className={fieldCls} name="address" placeholder="Business Address" rows={3} value={form.address} onChange={handleChange} required />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Business Information</h2>
          <input className={fieldCls} name="gstNumber" placeholder="GST Registration Number" value={form.gstNumber} onChange={handleChange} />
          <input className={fieldCls} name="tradeLicenseNo" placeholder="Business License/Trade License No." value={form.tradeLicenseNo} onChange={handleChange} />
          <input className={fieldCls} name="bankAccountNumber" placeholder="Bank Account Number" value={form.bankAccountNumber} onChange={handleChange} />
          <input className={fieldCls} name="bankNameIfsc" placeholder="Bank Name & IFSC Code" value={form.bankNameIfsc} onChange={handleChange} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Identity Proof (Paste link or upload to drive and paste link)</h2>
          <select className={fieldCls} name="identityProofType" value={form.identityProofType} onChange={handleChange}>
            <option value="">Select proof type</option>
            <option>Aadhar Card</option>
            <option>PAN Card</option>
            <option>Passport</option>
            <option>Voter ID</option>
            <option>Driving License</option>
            <option>GST Certificate</option>
            <option>Business License</option>
          </select>
          <input className={fieldCls} name="identityProofUrl" placeholder="Identity Proof Link (URL)" value={form.identityProofUrl} onChange={handleChange} />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Product/Service Details</h2>
          <input className={fieldCls} name="productCategory" placeholder="Category of Products/Services Supplied" value={form.productCategory} onChange={handleChange} />
          <input className={fieldCls} name="deliveryCapability" placeholder="Delivery Capability (Daily/Weekly/Monthly)" value={form.deliveryCapability} onChange={handleChange} />
          <textarea className={fieldCls} name="previousClients" placeholder="Previous Clients/References (if any)" rows={2} value={form.previousClients} onChange={handleChange} />
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" name="declarationAccepted" checked={form.declarationAccepted} onChange={handleChange} className="mt-1" />
          <p className="text-sm text-gray-700">I hereby declare that the information provided above is true and correct to the best of my knowledge.</p>
        </div>

        <button disabled={submitting || !form.declarationAccepted} className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60">{submitting ? 'Submitting...' : 'Submit Application'}</button>
      </form>
    </div>
  );
};

export default SupplierOnboardingPublic;


