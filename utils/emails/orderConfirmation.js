const emailLayout = require("./emailLayout");

module.exports = ({ name, products, total }) => {
  const items = products
    .map(
      (p) => `
<tr>
  <td style="padding:12px 0;border-bottom:1px solid #eee;">
    ${p.title}
  </td>

  <td align="center" style="border-bottom:1px solid #eee;">
    ${p.qty} db
  </td>

  <td align="right" style="border-bottom:1px solid #eee;">
    <strong>${(p.price * p.qty).toLocaleString("hu-HU")} Ft</strong>
  </td>
</tr>
`
    )
    .join("");

  return emailLayout({
    title: "Köszönjük a vásárlást!",

    subtitle: "Sikeres rendelés",

    greeting: `Kedves ${name}! 👋`,

    content: `
      <p>
        Köszönjük a vásárlást!
      </p>

      <p>
        A rendelésed sikeresen feldolgozásra került.
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

        <strong>Végösszeg:</strong><br><br>

        <span style="font-size:24px;font-weight:bold;color:#16a34a;">
          ${Number(total).toLocaleString("hu-HU")} Ft
        </span>

      </div>

      <p style="margin-top:25px;">
        A megvásárolt termékeket a fiókodban bármikor eléred.
      </p>
    `,

    buttonText: "Belépés a fiókomba",

    buttonUrl: "https://www.osztonkod.hu/dashboard",

    footerNote:
      "Köszönjük, hogy az Ösztönkódot választottad!",
  });
};