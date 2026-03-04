const sendEmail = require("./sendEmail");

module.exports = async function sendManualOrderBillingEmail({
  to,
  customerName,
  billingAddress,
  billingTaxNumber,
  products,
  totalAmount,
  orderReference,
  paidAt,
}) {
  await sendEmail({
    to,
    subject: "Sikeres vásárlás – számlázási adatok",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <h2>Kedves ${customerName}!</h2>

        <p>
          A vásárlásod sikeresen megtörtént. Az alábbi adatok alapján
          a számla <strong>manuálisan kerül kiállításra</strong>.
        </p>

        <h3>🧾 Számlázási adatok</h3>
        <p>
          <strong>Név:</strong> ${customerName}<br />
          <strong>Cím:</strong> ${billingAddress}<br />
          ${
            billingTaxNumber
              ? `<strong>Adószám:</strong> ${billingTaxNumber}<br />`
              : ""
          }
        </p>

        <h3>📦 Vásárolt termékek</h3>
        <ul>
          ${products
            .map(
              (p) =>
                `<li>${p.title} – ${p.qty} db – ${p.price} Ft</li>`
            )
            .join("")}
        </ul>

        <p>
          <strong>Összesen fizetve:</strong> ${totalAmount} Ft<br />
          <strong>Fizetés dátuma:</strong> ${paidAt}<br />
          <strong>Rendelés azonosító:</strong> ${orderReference}
        </p>

        <p>
          A számlát rövidesen kiállítjuk, és külön emailben elküldjük.
        </p>

        <p>Köszönjük a vásárlást!</p>
      </div>
    `,
  });
};
