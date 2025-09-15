// Lightweight, professional invoice PDF generator
// Uses jsPDF and autoTable for a clean, error-free layout

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper to format currency consistently
const formatCurrency = (amount, currencySymbol = '₹') => {
  const num = typeof amount === 'number' ? amount : Number(amount || 0);
  return `${currencySymbol}${num.toFixed(2)}`;
};

// Public API: generateInvoice(order, payment)
// - order: { id, date, customer: { name, email, phone, address }, items: [{name, quantity, price}], totalAmount }
// - payment: { id, method, status }
// Returns a Blob URL and triggers download by default
class InvoiceService {
  generateInvoice(orderData, paymentData, options = { download: true }) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // Brand/Header band
    doc.setFillColor(0, 121, 107); // teal-ish
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 90, 'F');
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('Invoice', 40, 58);

    // Company block (right)
    doc.setFontSize(12);
    const rightX = doc.internal.pageSize.getWidth() - 40;
    doc.text('FreshNest', rightX, 30, { align: 'right' });
    doc.text('Warehouse & Grocery', rightX, 48, { align: 'right' });
    doc.text('support@freshnest.example', rightX, 66, { align: 'right' });

    // Bill to and meta
    doc.setTextColor('#000000');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Bill To:', 40, 120);

    const customer = orderData?.customer || {};
    const billLines = [
      customer.name || 'Customer',
      customer.email || '',
      customer.phone || '',
      customer.address || ''
    ].filter(Boolean);

    doc.setFont('helvetica', 'normal');
    let y = 138;
    billLines.forEach((line) => {
      doc.text(String(line), 40, y);
      y += 16;
    });

    // Invoice meta (right)
    const metaStartY = 120;
    const meta = [
      ['Invoice #', String(orderData?.id || paymentData?.orderId || Date.now())],
      ['Date', new Date(orderData?.date || Date.now()).toLocaleDateString()],
      ['Payment ID', String(paymentData?.id || paymentData?.razorpay_payment_id || '-')],
      ['Payment Method', String(paymentData?.method || 'Online')],
      ['Status', String(paymentData?.status || 'Paid')]
    ];

    meta.forEach((row, idx) => {
      const labelY = metaStartY + idx * 18;
      doc.setFont('helvetica', 'bold');
      doc.text(row[0], rightX - 180, labelY, { align: 'left' });
      doc.setFont('helvetica', 'normal');
      doc.text(': ' + row[1], rightX - 100, labelY, { align: 'left' });
    });

    // Items table
    const items = (orderData?.items || []).map((it, idx) => ({
      sno: idx + 1,
      description: it.name || it.title || 'Item',
      quantity: it.quantity || 1,
      price: formatCurrency(it.price || 0),
      amount: formatCurrency((it.price || 0) * (it.quantity || 1))
    }));

    const tableStartY = Math.max(y + 10, 210);

    doc.autoTable({
      startY: tableStartY,
      styles: { fontSize: 10, cellPadding: 6, lineColor: [230, 230, 230], lineWidth: 0.5 },
      headStyles: { fillColor: [0, 121, 107], textColor: 255, halign: 'left' },
      head: [[
        'Items', 'Description', 'Quantity', 'Price', 'Amount'
      ]],
      body: items.map((row) => [row.sno, row.description, String(row.quantity), row.price, row.amount]),
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 240 },
        2: { cellWidth: 80, halign: 'right' },
        3: { cellWidth: 90, halign: 'right' },
        4: { cellWidth: 100, halign: 'right' }
      }
    });

    // Totals box
    const total = Number(orderData?.totalAmount || items.reduce((t, r) => t + Number((r.amount || '0').replace(/[^\d.]/g, '')), 0));
    const subtotal = total; // extend with taxes/discounts if needed
    const afterTableY = doc.lastAutoTable.finalY + 16;
    const boxX = doc.internal.pageSize.getWidth() - 240;
    const lineGap = 18;

    const totals = [
      ['Subtotal', subtotal],
      ['Tax', 0],
      ['Total', total]
    ];

    totals.forEach((tRow, i) => {
      doc.setFont('helvetica', i === totals.length - 1 ? 'bold' : 'normal');
      doc.text(tRow[0], boxX, afterTableY + i * lineGap);
      doc.text(formatCurrency(tRow[1]), boxX + 140, afterTableY + i * lineGap, { align: 'right' });
    });

    // Notes/footer
    const notesY = afterTableY + totals.length * lineGap + 24;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 40, notesY);
    doc.setFont('helvetica', 'normal');
    const note = 'Thank you for your purchase! For support, contact support@freshnest.example';
    doc.text(doc.splitTextToSize(note, 360), 40, notesY + 16);

    // Footer branding bar
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(0, 121, 107);
    doc.rect(0, pageH - 60, doc.internal.pageSize.getWidth(), 60, 'F');
    doc.setTextColor('#ffffff');
    doc.setFont('helvetica', 'normal');
    doc.text('Powered by FreshNest', 40, pageH - 24);

    // Save or return blob url
    const fileName = `Invoice_${orderData?.id || paymentData?.id || Date.now()}.pdf`;
    if (options?.download !== false) {
      doc.save(fileName);
    }
    return fileName;
  }
}

const invoiceService = new InvoiceService();
export default invoiceService;







