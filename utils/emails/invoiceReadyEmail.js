// utils/emails/invoiceReadyEmail.js

const emailLayout = require("./emailLayout");

module.exports = ({ name, invoiceNumber, pdfUrl }) => ({
  subject: `Számla elkészült – ${invoiceNumber}`,

  html: emailLayout({
    title: "Számla elkészült",

    subtitle: "Számlázás és előfizetések",

    greeting: `Kedves ${name}!`,

    content: `
      <p>
        Elkészült a számlád, amely már letölthető PDF formátumban.
      </p>

      <table
        width="100%"
        role="presentation"
        style="
          margin:30px 0;
          background:#f8fafc;
          border-left:5px solid #16a34a;
          border-radius:10px;
        ">
        <tr>
          <td style="padding:20px;">
            <strong>📄 Számlaszám:</strong><br>
            ${invoiceNumber}
          </td>
        </tr>
      </table>

      <p>
        A számla letöltéséhez kattints az alábbi gombra.
      </p>
    `,

    buttonText: "Számla letöltése",

    buttonUrl: pdfUrl,

    footerNote:
      "Ha a gomb nem működik, másold be a böngésződbe a számla letöltési hivatkozását.",
  }),
});