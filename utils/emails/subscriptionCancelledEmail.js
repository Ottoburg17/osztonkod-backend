const emailLayout = require("./emailLayout");

module.exports = ({ name, productName, cancelDate, accessUntil }) => ({
  subject: "Előfizetés lemondva",

  html: emailLayout({
    title: "Előfizetés lemondva",

    subtitle: "Az előfizetésed állapota frissült",

    greeting: `Kedves ${name}!`,

    content: `
      <p>
        Visszaigazoljuk, hogy az előfizetésed sikeresen lemondásra került.
      </p>

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          margin:30px 0;
          background:#f8fafc;
          border-left:5px solid #16a34a;
          border-radius:10px;
        ">

        <tr>
          <td style="padding:22px;">

            <strong>📦 Szolgáltatás</strong><br>
            ${productName}

            <br><br>

            <strong>📅 Lemondás dátuma</strong><br>
            ${cancelDate}

            <br><br>

            <strong>🔓 Hozzáférés vége</strong><br>
            ${accessUntil}

          </td>
        </tr>

      </table>

      <div
        style="
          margin-top:30px;
          padding:20px;
          background:#ecfdf5;
          border-left:5px solid #16a34a;
          border-radius:10px;
          color:#374151;
        ">

        <strong>ℹ️ Fontos</strong>

        <br><br>

        Az előfizetésed ugyan lemondásra került,
        de a hozzáférésed a megadott dátumig továbbra is aktív marad.

        Eddig az időpontig a szolgáltatás minden funkcióját
        változatlanul használhatod.

      </div>
    `,

    buttonText: "Fiókom megnyitása",

    buttonUrl: `${process.env.FRONTEND_URL}/dashboard`,

    footerNote:
      "Sajnáljuk, hogy távozol. Reméljük, a jövőben ismét az Ösztönkód felhasználói között üdvözölhetünk.",
  }),
});