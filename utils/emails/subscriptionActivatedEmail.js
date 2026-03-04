module.exports = ({ name, productName, startDate }) => ({
  subject: "Előfizetés aktiválva",
  html: `
    <p>Kedves ${name}!</p>

    <p>Örömmel értesítünk, hogy az előfizetésed sikeresen aktiválásra került.</p>

    <p>
      <strong>Szolgáltatás:</strong> ${productName}<br/>
      <strong>Aktiválás dátuma:</strong> ${startDate}
    </p>

    <p>
      A hozzáférésed azonnal elérhető a fiókodban.
    </p>

    <p>
      Fontos: digitális szolgáltatás lévén a teljesítés azonnali, az elállási jog nem gyakorolható.
    </p>

    <p>Üdvözlettel,<br/>Ösztönkód csapat</p>
  `,
});
