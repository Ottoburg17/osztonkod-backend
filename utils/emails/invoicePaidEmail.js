module.exports = ({ name, invoiceNumber, amount, pdfUrl }) => ({
  subject: `Számla kiegyenlítve – ${invoiceNumber}`,
  html: `
    <p>Kedves ${name}!</p>

    <p>Örömmel értesítünk, hogy az alábbi számlád kiegyenlítésre került:</p>

    <p>
      <strong>Számlaszám:</strong> ${invoiceNumber}<br/>
      <strong>Összeg:</strong> ${Number(amount).toLocaleString("hu-HU")} Ft
    </p>

    <p>
      <a href="${pdfUrl}" target="_blank">
        📄 Számla PDF megnyitása
      </a>
    </p>

    <p>Köszönjük a bizalmat!</p>
  `,
});
