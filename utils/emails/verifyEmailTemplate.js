module.exports = ({ name, verifyLink, expiresHours = 24 }) => `
<!DOCTYPE html>
<html lang="hu">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Email megerősítése</title>
</head>

<body style="
margin:0;
padding:0;
background:#eef2f7;
font-family:Arial,Helvetica,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:40px 15px;">

<tr>

<td align="center">

<table
role="presentation"
width="620"
cellpadding="0"
cellspacing="0"
style="
max-width:620px;
background:#ffffff;
border-radius:20px;
overflow:hidden;
box-shadow:0 12px 40px rgba(0,0,0,.08);
">

<tr>

<td
align="center"
style="
background:#16a34a;
padding:45px 40px;
">

<div style="
font-size:36px;
font-weight:700;
color:#ffffff;
">

🟢 Ösztönkód

</div>

<div style="
margin-top:12px;
font-size:17px;
color:#dff7e7;
line-height:1.6;
">

Fedezd fel az automatikus reakcióid mögötti mintákat

</div>

</td>

</tr>

<tr>

<td style="padding:48px;">

<h1 style="
margin:0;
font-size:30px;
color:#111827;
">

Szia ${name}! 👋

</h1>

<p style="
margin-top:28px;
font-size:17px;
line-height:1.8;
color:#4b5563;
">

Köszönjük, hogy regisztráltál az
<strong>Ösztönkód</strong>
közösségébe.

</p>

<p style="
font-size:17px;
line-height:1.8;
color:#4b5563;
">

Az első lépésként kérjük erősítsd meg
az email címed.

</p>

<table
align="center"
role="presentation"
cellpadding="0"
cellspacing="0"
style="margin:40px auto 10px auto;">

<tr>

<td
align="center"
style="
background:#16a34a;
border-radius:12px;
">

<a
href="${verifyLink}"
style="
display:inline-block;
padding:18px 42px;
font-size:18px;
font-weight:bold;
color:#ffffff;
text-decoration:none;
">

Email címem megerősítése →

</a>

</td>

</tr>

</table>

<p style="
text-align:center;
font-size:14px;
color:#6b7280;
margin-bottom:40px;
">

A gombra kattintva aktiválod a fiókodat.

</p>

<table
width="100%"
role="presentation"
style="
background:#f8fafc;
border-left:5px solid #16a34a;
border-radius:10px;
">

<tr>

<td style="padding:22px;">

<div style="
font-weight:bold;
font-size:17px;
color:#111827;
margin-bottom:10px;
">

⏰ Fontos információ

</div>

<div style="
font-size:15px;
line-height:1.8;
color:#4b5563;
">

• A megerősítő link
<strong>${expiresHours} óráig</strong>
érvényes.

<br><br>

• A link egyszer használható fel.

</div>

</td>

</tr>

</table>

<p style="
margin-top:40px;
font-size:15px;
line-height:1.7;
color:#4b5563;
">

Ha a gomb nem működik, másold be ezt
a linket a böngésződ címsorába:

</p>

<div style="
background:#f3f4f6;
border-radius:10px;
padding:18px;
font-size:13px;
line-height:1.7;
word-break:break-all;
color:#15803d;
">

${verifyLink}

</div>

<hr style="
margin:45px 0;
border:none;
border-top:1px solid #e5e7eb;
">

<div style="
font-size:14px;
line-height:1.8;
color:#6b7280;
">

Ha nem te regisztráltál az Ösztönkód oldalán,
egyszerűen hagyd figyelmen kívül ezt az emailt.

</div>

</td>

</tr>

<tr>

<td
align="center"
style="
background:#f9fafb;
padding:30px;
border-top:1px solid #ececec;
">

<div style="
font-size:14px;
font-weight:bold;
color:#111827;
">

🟢 Ösztönkód

</div>

<div style="
margin-top:8px;
font-size:13px;
color:#6b7280;
line-height:1.8;
">

Ez egy automatikusan küldött rendszerüzenet.<br>
Kérjük, ne válaszolj erre az e-mailre.

</div>

<div style="
margin-top:18px;
">

<a
href="https://www.osztonkod.hu"
style="
color:#16a34a;
text-decoration:none;
font-weight:bold;
">

www.osztonkod.hu

</a>

</div>

<div style="
margin-top:20px;
font-size:12px;
color:#9ca3af;
">

© ${new Date().getFullYear()} Ösztönkód • Minden jog fenntartva.

</div>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>
</html>
`;