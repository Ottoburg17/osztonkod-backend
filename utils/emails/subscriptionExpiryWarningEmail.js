const emailLayout = require("./emailLayout");

module.exports = ({ name, productName, expiresAt, daysLeft }) => ({
  subject: `Előfizetés lejár ${daysLeft} napon belül`,

  html: emailLayout({
    title: "Előfizetés hamarosan lejár",

    subtitle: "Ne veszítsd el a hozzáférésed",

    greeting: `Kedves ${name}!`,

    content: `
      <p>
        Szeretnénk emlékeztetni, hogy az előfizetésed hamarosan lejár.
      </p>

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          margin:30px 0;
          background:#f8fafc;
          border-left:5px solid #f59e0b;
          border-radius:10px;
        ">

        <tr>
          <td style="padding:22px;">

            <strong>📦 Szolgáltatás</strong><br>
            ${productName}

            <br><br>

            <strong>📅 Lejárat dátuma</strong><br>
            ${expiresAt}

            <br><br>

            <strong>⏳ Hátralévő idő</strong><br>
            ${
              daysLeft === 1
                ? "Már csak 1 nap maradt."
                : `${daysLeft} nap van hátra.`
            }

          </td>
        </tr>

      </table>

      <div
        style="
          margin-top:30px;
          padding:20px;
          background:#fffbeb;
          border-left:5px solid #f59e0b;
          border-radius:10px;
          color:#374151;
        ">

        <strong>⚠️ Fontos</strong>

        <br><br>

        ${
          daysLeft === 1
            ? "Az előfizetésed holnap lejár. Ha szeretnéd megszakítás nélkül használni a szolgáltatást, kérjük, újítsd meg még ma."
            : `Már csak ${daysLeft} nap van hátra az előfizetésedből. Ha szeretnéd továbbra is használni a szolgáltatást, kérjük, újítsd meg időben.`
        }

      </div>
    `,

    buttonText: "Előfizetés megújítása",

    buttonUrl: `${process.env.FRONTEND_URL}/pricing`,

    footerNote:
      "Köszönjük, hogy az Ösztönkódot használod! Reméljük, továbbra is velünk maradsz.",
  }),
});