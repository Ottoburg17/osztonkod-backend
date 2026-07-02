const emailLayout = require("./emailLayout");

module.exports = ({ name, product, expiresAt }) => ({
  subject: "⏰ Előfizetésed 7 nap múlva lejár",

  html: emailLayout({
    title: "Előfizetés hamarosan lejár",

    subtitle: "7 nap van hátra",

    greeting: `Kedves ${name}!`,

    content: `
      <p>
        Szeretnénk időben emlékeztetni, hogy az előfizetésed
        <strong>7 nap múlva lejár</strong>.
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
            ${product}

            <br><br>

            <strong>📅 Lejárat dátuma</strong><br>
            ${new Date(expiresAt).toLocaleDateString("hu-HU")}

            <br><br>

            <strong>⏳ Hátralévő idő</strong><br>
            7 nap

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

        <strong>ℹ️ Emlékeztető</strong>

        <br><br>

        A hozzáférésed a lejárati dátumig teljes mértékben aktív marad.

        Ha szeretnéd megszakítás nélkül tovább használni az
        Ösztönkód szolgáltatásait, érdemes még a lejárat előtt
        megújítani az előfizetésed.

      </div>

      <p style="margin-top:30px;">
        A megújítás csak néhány kattintás, és a hozzáférésed
        folyamatos marad.
      </p>
    `,

    buttonText: "Előfizetés megújítása",

    buttonUrl: `${process.env.FRONTEND_URL}/pricing`,

    footerNote:
      "Köszönjük, hogy az Ösztönkódot használod! Reméljük, továbbra is velünk maradsz.",
  }),
});