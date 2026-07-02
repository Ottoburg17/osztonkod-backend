const emailLayout = require("./emailLayout");

module.exports = ({ name, product, expiresAt }) => ({
  subject: "⚠️ Előfizetésed holnap lejár",

  html: emailLayout({
    title: "Utolsó emlékeztető",

    subtitle: "Az előfizetésed holnap lejár",

    greeting: `Kedves ${name}!`,

    content: `
      <p>
        Ez egy utolsó emlékeztető, hogy az előfizetésed
        <strong>holnap lejár</strong>.
      </p>

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          margin:30px 0;
          background:#f8fafc;
          border-left:5px solid #dc2626;
          border-radius:10px;
        ">

        <tr>
          <td style="padding:22px;">

            <strong>📦 Szolgáltatás</strong><br>
            ${product}

            <br><br>

            <strong>📅 Lejárat dátuma</strong><br>
            ${new Date(expiresAt).toLocaleDateString("hu-HU")}

            <br><br>

            <strong>⏳ Hátralévő idő</strong><br>
            Kevesebb mint 24 óra

          </td>
        </tr>

      </table>

      <div
        style="
          margin-top:30px;
          padding:20px;
          background:#fef2f2;
          border-left:5px solid #dc2626;
          border-radius:10px;
          color:#374151;
        ">

        <strong>⚠️ Fontos</strong>

        <br><br>

        Ha nem újítod meg az előfizetésed, a lejárat után
        a hozzáférésed automatikusan megszűnik, és a szolgáltatás
        funkciói nem lesznek elérhetők.

      </div>

      <p style="margin-top:30px;">
        Ha szeretnéd megszakítás nélkül használni az Ösztönkódot,
        kérjük, újítsd meg az előfizetésed még ma.
      </p>
    `,

    buttonText: "Előfizetés megújítása",

    buttonUrl: `${process.env.FRONTEND_URL}/pricing`,

    footerNote:
      "Köszönjük, hogy az Ösztönkódot használod! Reméljük, továbbra is velünk maradsz.",
  }),
});