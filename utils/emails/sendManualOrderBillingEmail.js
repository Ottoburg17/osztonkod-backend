const emailLayout = require("./emailLayout");

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

  const items = products
    .map(
      (p) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          ${p.title}
        </td>

        <td align="center" style="border-bottom:1px solid #eee;">
          ${p.qty} db
        </td>

        <td align="right" style="border-bottom:1px solid #eee;">
          <strong>${Number(p.price).toLocaleString("hu-HU")} Ft</strong>
        </td>
      </tr>
    `
    )
    .join("");

  await sendEmail({
    to,

    subject: "Sikeres vásárlás – számlázási adatok",

    html: emailLayout({

      title: "Sikeres vásárlás",

      subtitle: "Köszönjük a rendelésed!",

      greeting: `Kedves ${customerName}! 👋`,

      content: `
        <p>
          A vásárlásod sikeresen megtörtént.
        </p>

        <p>
          A számlát manuálisan állítjuk ki, és külön e-mailben küldjük el.
        </p>

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="margin-top:25px;border-collapse:collapse;">

          <thead>

            <tr style="background:#f8fafc;">

              <th align="left" style="padding:12px;">
                Termék
              </th>

              <th align="center">
                Mennyiség
              </th>

              <th align="right" style="padding-right:10px;">
                Ár
              </th>

            </tr>

          </thead>

          <tbody>

            ${items}

          </tbody>

        </table>

        <div
          style="
            margin-top:30px;
            padding:20px;
            background:#f8fafc;
            border-left:5px solid #16a34a;
            border-radius:10px;
          ">

          <strong>📦 Rendelés azonosító</strong><br>

          ${orderReference}

          <br><br>

          <strong>💰 Fizetett összeg</strong><br>

          ${Number(totalAmount).toLocaleString("hu-HU")} Ft

          <br><br>

          <strong>📅 Fizetés dátuma</strong><br>

          ${paidAt}

        </div>

        <div
          style="
            margin-top:30px;
            padding:20px;
            background:#f8fafc;
            border-left:5px solid #16a34a;
            border-radius:10px;
          ">

          <strong>🏢 Számlázási adatok</strong>

          <br><br>

          <strong>Név:</strong> ${customerName}<br>

          <strong>Cím:</strong> ${billingAddress}<br>

          ${
            billingTaxNumber
              ? `<strong>Adószám:</strong> ${billingTaxNumber}`
              : ""
          }

        </div>
      `,

      footerNote:
        "Köszönjük a vásárlást! A számlát hamarosan külön e-mailben elküldjük.",

    }),
  });
};