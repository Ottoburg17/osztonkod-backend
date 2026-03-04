// utils/emails/invoiceReadyEmail.js
module.exports = ({ name, invoiceNumber, pdfUrl }) => ({
  subject: `Számla elkészült – ${invoiceNumber}`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <h2>Kedves ${name}!</h2>

      <p>
        Értesítünk, hogy a számlád elkészült.
      </p>

      <p>
        <strong>Számlaszám:</strong> ${invoiceNumber}
      </p>

      <p>
        A számlát az alábbi linken tudod letölteni:
      </p>

      <p>
        <a href="${pdfUrl}" target="_blank"
           style="display:inline-block;padding:10px 16px;
                  background:#2563eb;color:#fff;
                  text-decoration:none;border-radius:6px;">
          Számla letöltése (PDF)
        </a>
      </p>

      <p>
        Üdvözlettel,<br/>
        <strong>Ösztönkód csapat</strong>
      </p>
    </div>
  `,
});
