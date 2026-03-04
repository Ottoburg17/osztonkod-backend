module.exports = function orderConfirmationEmail({
  name,
  products,
  total,
}) {
  const items = products
    .map(
      (p) => `
        <tr>
          <td style="padding:6px 0;">${p.title}</td>
          <td align="center">${p.qty} db</td>
          <td align="right"><b>${p.price * p.qty} Ft</b></td>
        </tr>
      `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px;">
        <table width="600" style="background:#ffffff;border-radius:12px;padding:24px;">

          <tr>
            <td align="center">
              <h2 style="color:#047857;">Köszönjük a vásárlást! 🎉</h2>
            </td>
          </tr>

          <tr>
            <td>
              <p>Kedves <b>${name}</b>,</p>

              <p>
                Sikeresen megvásároltad az alábbi termék(ek)et az
                <b>Ösztönkód</b> oldalon:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                <thead>
                  <tr>
                    <th align="left">Termék</th>
                    <th align="center">Mennyiség</th>
                    <th align="right">Ár</th>
                  </tr>
                </thead>
                <tbody>
                  ${items}
                </tbody>
              </table>

              <hr style="margin:20px 0;" />

              <p style="font-size:18px;">
                <b>Összesen: ${total} Ft</b>
              </p>

              <p style="text-align:center;margin:24px 0;">
                <a
                  href="http://localhost:5173/dashboard"
                  style="
                    background:#047857;
                    color:#ffffff;
                    padding:12px 24px;
                    border-radius:8px;
                    text-decoration:none;
                    font-weight:bold;
                    display:inline-block;
                  "
                >
                  Belépés a fiókomba
                </a>
              </p>

              <p>
                A megvásárolt tartalmakat a fiókodban éred el.
              </p>

              <p>
                Üdvözlettel,<br/>
                <b>Ösztönkód csapat</b>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
