const emailLayout = require("./emailLayout");

module.exports = (resetUrl) =>
  emailLayout({
    title: "Jelszó visszaállítása",

    subtitle: "Biztonságos fiókkezelés",

    greeting: "🔐 Jelszó visszaállítása",

    content: `
      <p>Szia!</p>

      <p>
        Jelszó-visszaállítási kérelmet kaptunk az
        <strong>Ösztönkód</strong> fiókodhoz.
      </p>

      <p>
        Ha ezt valóban te kezdeményezted,
        kattints az alábbi gombra, és állíts be egy új jelszót.
      </p>

      <div
        style="
          margin:30px 0;
          padding:18px;
          background:#ecfdf5;
          border-left:4px solid #16a34a;
          border-radius:10px;
          color:#166534;
          line-height:1.7;
        "
      >
        ⏳ Ez a link <strong>30 percig érvényes</strong>,
        és biztonsági okokból csak egyszer használható fel.
      </div>

      <p>
        Ha a gomb valamilyen okból nem működik,
        másold be az alábbi hivatkozást a böngésződ címsorába:
      </p>

      <p style="word-break:break-all;">
        <a
          href="${resetUrl}"
          style="color:#16a34a;text-decoration:none;"
        >
          ${resetUrl}
        </a>
      </p>

      <p>
        Ha nem te kérted ezt a műveletet,
        egyszerűen hagyd figyelmen kívül ezt az emailt.
        A fiókod biztonságban marad.
      </p>
    `,

    buttonText: "Jelszó visszaállítása",

    buttonUrl: resetUrl,

    footerNote: `
      Ez a jelszó-visszaállító link kizárólag a megadott
      felhasználói fiókhoz használható fel.
      Ha nem te kezdeményezted a kérést,
      nincs további teendőd.
    `,
  });