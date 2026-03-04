module.exports = ({ name, productName, expiresAt, daysLeft }) => ({
  subject: `Előfizetés lejár ${daysLeft} napon belül`,
  html: `
    <p>Kedves ${name}!</p>

    <p>
      Az alábbi előfizetésed hamarosan lejár:
    </p>

    <p>
      <strong>Szolgáltatás:</strong> ${productName}<br/>
      <strong>Lejárat:</strong> ${expiresAt}
    </p>

    <p>
      ${daysLeft === 1
        ? "Holnap lejár az előfizetésed."
        : `Már csak ${daysLeft} nap van hátra.`}
    </p>

    <p>Üdvözlettel,<br/>Ösztönkód csapat</p>
  `,
});
