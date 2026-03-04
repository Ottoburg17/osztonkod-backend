module.exports = ({ name, product, expiresAt }) => ({
  subject: "⚠️ Előfizetésed holnap lejár",
  html: `
    <p>Kedves ${name}!</p>

    <p>Ez egy utolsó emlékeztető, hogy az alábbi előfizetésed
    <strong>holnap lejár</strong>:</p>

    <p>
      <strong>Termék:</strong> ${product}<br/>
      <strong>Lejárat:</strong> ${new Date(expiresAt).toLocaleDateString("hu-HU")}
    </p>

    <p>
      A hozzáférés a lejárat napjáig él.
    </p>

    <p>Üdvözlettel,<br/>Ösztönkód csapat</p>
  `,
});
