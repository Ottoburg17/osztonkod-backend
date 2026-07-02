const emailLayout = require("./emailLayout");

module.exports = ({ name, productName, startDate }) => ({
  subject: "Előfizetés aktiválva",

  html: emailLayout({
    title: "Előfizetés aktiválva",

    subtitle: "Köszönjük a bizalmadat!",

    greeting: `Kedves ${name}! 👋`,

    content: `
      <p>
        Örömmel értesítünk, hogy az előfizetésed sikeresen aktiválásra került.
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

            <strong>📅 Aktiválás dátuma</strong><br>
            ${startDate}

          </td>
        </tr>

      </table>

      <p>
        A hozzáférésed azonnal elérhető a fiókodban.
      </p>

      <p>
        Most már használhatod az előfizetéshez tartozó összes funkciót.
      </p>

      <div
        style="
          margin-top:30px;
          padding:20px;
          background:#fefce8;
          border-left:5px solid #eab308;
          border-radius:10px;
          color:#444;
        ">

        <strong>📌 Fontos tudnivaló</strong>

        <br><br>

        Digitális szolgáltatás esetén a teljesítés azonnal megkezdődik,
        ezért az elállási jog a vonatkozó jogszabályok szerint nem gyakorolható.

      </div>
    `,

    buttonText: "Fiókom megnyitása",

    buttonUrl: "https://www.osztonkod.hu/dashboard",

    footerNote:
      "Köszönjük, hogy az Ösztönkódot választottad! Jó munkát és sok sikert kívánunk a rendszer használatához.",
  }),
});