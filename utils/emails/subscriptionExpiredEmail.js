const emailLayout = require("./emailLayout");

module.exports = ({ name, product, expiredAt }) => ({
  subject: "Előfizetésed lejárt",

  html: emailLayout({
    title: "Előfizetés lejárt",

    subtitle: "Az előfizetésed hozzáférése megszűnt",

    greeting: `Kedves ${name}!`,

    content: `
      <p>
        Értesítünk, hogy az előfizetésed lejárt, ezért a szolgáltatás jelenleg már nem érhető el.
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
            ${new Date(expiredAt).toLocaleDateString("hu-HU")}

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

        <strong>⚠️ Hozzáférés megszűnt</strong>

        <br><br>

        Az előfizetésed lejárt, ezért a szolgáltatás jelenleg nem használható.

        Bármikor újra előfizethetsz a fiókodban, és a hozzáférésed azonnal újra aktiválódik.

      </div>
    `,

    buttonText: "Előfizetés megújítása",

    buttonUrl: `${process.env.FRONTEND_URL}/pricing`,

    footerNote:
      "Reméljük, hamarosan ismét az Ösztönkód felhasználói között üdvözölhetünk.",
  }),
});