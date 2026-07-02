const emailLayout = require("./emailLayout");

module.exports = ({ name, invoiceNumber, amount, pdfUrl }) => ({
  subject: `Számla kiegyenlítve – ${invoiceNumber}`,

  html: emailLayout({

    title: "Számla kiegyenlítve",

    subtitle: "Számlázás és előfizetések",

    greeting: `Kedves ${name}!`,

    content: `
      <p>Örömmel értesítünk, hogy a számlád kiegyenlítésre került.</p>

      <p><strong>Számlaszám:</strong> ${invoiceNumber}</p>

      <p><strong>Összeg:</strong> ${Number(amount).toLocaleString("hu-HU")} Ft</p>
    `,

    buttonText: "Számla letöltése",

    buttonUrl: pdfUrl,

    footerNote:
      "Köszönjük, hogy az Ösztönkód szolgáltatását választottad.",
  }),
});