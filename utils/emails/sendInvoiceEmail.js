const sendEmail = require("./sendEmail");

module.exports = async function sendInvoiceEmail({
  to,
  customerName,
  customerEmail,
  reference,
  amount,
  currency = "Ft",
  billingName,
  billingCountry,
  billingZip,
  billingCity,
  billingAddress,
  billingTaxNumber,
  productName,
}) {
  await sendEmail({
    to,
    subject: `🧾 Új manuális számla – ${reference}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px">
        <h2>Új számla kiállítandó</h2>

        <hr />

        <h3>🧾 Vásárlás adatai</h3>
        <table cellpadding="6">
          <tr><td><strong>Hivatkozás:</strong></td><td>${reference}</td></tr>
          <tr><td><strong>Termék:</strong></td><td>${productName}</td></tr>
          <tr><td><strong>Összeg:</strong></td><td>${amount} ${currency}</td></tr>
        </table>

        <hr />

        <h3>👤 Ügyfél adatok</h3>
        <table cellpadding="6">
          <tr><td><strong>Név:</strong></td><td>${customerName}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${customerEmail}</td></tr>
        </table>

        <hr />

        <h3>🏢 Számlázási adatok</h3>
        <table cellpadding="6">
          <tr><td><strong>Számlázási név:</strong></td><td>${billingName}</td></tr>
          <tr>
            <td><strong>Cím:</strong></td>
            <td>
              ${billingCountry}<br/>
              ${billingZip} ${billingCity}<br/>
              ${billingAddress}
            </td>
          </tr>
          ${
            billingTaxNumber
              ? `<tr><td><strong>Adószám:</strong></td><td>${billingTaxNumber}</td></tr>`
              : ""
          }
        </table>

        <p style="margin-top: 24px">
          A számlát manuálisan kell kiállítani és elküldeni az ügyfél részére.
        </p>
      </div>
    `,
  });
};
