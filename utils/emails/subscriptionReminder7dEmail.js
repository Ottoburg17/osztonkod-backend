module.exports = ({ name, product, expiresAt }) => ({
  subject: "⏰ Előfizetésed 7 nap múlva lejár",
  html: `
    <p>Kedves ${name}!</p>

    <p>Szeretnénk jelezni, hogy az alábbi előfizetésed
    <strong>7 nap múlva lejár</strong>:</p>

    <p>
      <strong>Termék:</strong> ${product}<br/>
      <strong>Lejárat:</strong> ${new Date(expiresAt).toLocaleDateString("hu-HU")}
    </p>

    <p>
      A hozzáférés a lejáratig zavartalanul elérhető.
      Ha szeretnéd folytatni, nincs teendőd.
    </p>

    <p>Üdvözlettel,<br/>Ösztönkód csapat</p>
  `,
});
