module.exports = ({ name, product, expiredAt }) => ({
  subject: "Előfizetésed lejárt",
  html: `
    <p>Kedves ${name}!</p>

    <p>
      Az előfizetésed az alábbi szolgáltatásra <strong>lejárt</strong>:
    </p>

    <p>
      <strong>Szolgáltatás:</strong> ${product}<br/>
      <strong>Lejárat dátuma:</strong> ${new Date(expiredAt).toLocaleDateString("hu-HU")}
    </p>

    <p>
      A hozzáférés jelenleg nem aktív.
      Bármikor újra előfizethetsz a fiókodban.
    </p>

    <p>
      Üdvözlettel,<br/>
      Ösztönkód csapat
    </p>
  `,
});
