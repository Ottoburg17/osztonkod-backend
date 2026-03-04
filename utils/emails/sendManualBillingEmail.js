const sendEmail = require("./sendEmail");

module.exports = async function sendManualBillingEmail({
  to,
  customerName,
  billingAddress,
  billingTaxNumber,
  productName,
  amount,
  reference,
  paidAt,
}) {
  await sendEmail({
    to,
    subject: `Fizetés beérkezett – számlázási adatok`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <h2>Új fizetés érkezett</h2>

        <p><strong>Hivatkozás:</strong> ${reference}</p>

        <h3>Vevő adatai</h3>
        <p>
          Név: ${customerName}<br />
          Cím: ${billingAddress}<br />
          ${billingTaxNumber ? `Adószám: ${billingTaxNumber}<br />` : ""}
        </p>

        <h3>Vásárlás</h3>
        <p>
          Termék: ${productName}<br />
          Összeg: ${amount} Ft<br />
          Fizetés dátuma: ${paidAt}
        </p>

        <p>
          ⚠️ Ez az email <b>nem számla</b>.<br />
          A számlát manuálisan kell kiállítani.
        </p>
      </div>
    `,
  });
};
