module.exports = ({ name, verifyLink, expiresHours = 24 }) => {
  return `
    <h1>Ösztönkód</h1>

    <p>Szia ${name}!</p>

    <p>Köszönjük a regisztrációdat.</p>

    <p>
      <a href="${verifyLink}">
        Email cím megerősítése
      </a>
    </p>

    <p>A link ${expiresHours} óráig érvényes.</p>
  `;
};