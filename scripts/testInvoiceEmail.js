require('dotenv').config();

const sendInvoiceEmail = require('../utils/emails/sendInvoiceEmail');

(async () => {
  try {
    await sendInvoiceEmail({
      to: 'Gyozike@gmail.com',
      customerName: 'Győző Kató',
      invoiceNumber: 'TEST-INV-0001',
      amount: 4999,
      status: 'paid',
      pdfUrl: 'https://example.com/test-invoice.pdf'
    });

    console.log('✅ Invoice email elküldve (Mailtrap)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Email küldési hiba:', err);
    process.exit(1);
  }
})();
