module.exports = ({ name, productName, cancelDate, accessUntil }) => ({
  subject: "Előfizetés lemondva",
  html: `
    <p>Kedves ${name}!</p>

    <p>Az alábbi előfizetésed lemondásra került:</p>

    <p>
      <strong>Szolgáltatás:</strong> ${productName}<br/>
      <strong>Lemondás dátuma:</strong> ${cancelDate}<br/>
      <strong>Hozzáférés vége:</strong> ${accessUntil}
    </p>

    <p>
      A hozzáférésed a megadott dátumig aktív marad.
    </p>

    <p>Üdvözlettel,<br/>Ösztönkód csapat</p>
  `,
});
