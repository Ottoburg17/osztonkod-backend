const emailLayout = require("./emailLayout");

module.exports = ({ name, verifyLink, expiresHours = 24 }) =>
  emailLayout({
    title: "Email cím megerősítése",

    subtitle: "Üdvözlünk az Ösztönkód közösségében!",

    greeting: `Szia, ${name}! 👋`,

    content: `
      <p>
        Köszönjük, hogy regisztráltál az
        <strong>Ösztönkód</strong> oldalára.
      </p>

      <p>
        Már csak egy lépés választ el attól, hogy teljes hozzáférést kapj a fiókodhoz.
      </p>

      <div
        style="
          margin:30px 0;
          padding:20px;
          background:#f8fafc;
          border-left:5px solid #16a34a;
          border-radius:10px;
          color:#374151;
        ">

        <strong>📧 Email cím megerősítése</strong>

        <br><br>

        Kérjük, kattints az alábbi gombra az email címed megerősítéséhez.

        <br><br>

        A megerősítő link
        <strong>${expiresHours} óráig</strong>
        érvényes, és egyszer használható fel.

      </div>
    `,

    buttonText: "Email címem megerősítése",

    buttonUrl: verifyLink,

    footerNote:
      "Ha nem te kezdeményezted a regisztrációt, egyszerűen hagyd figyelmen kívül ezt az e-mailt. A fiók csak az email cím megerősítése után aktiválódik.",
  });