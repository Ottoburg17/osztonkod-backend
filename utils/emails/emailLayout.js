module.exports = ({
  title,
  subtitle,
  greeting,
  content,
  buttonText,
  buttonUrl,
  footerNote,
}) => `
<!DOCTYPE html>
<html lang="hu">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
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
width="620"
cellpadding="0"
cellspacing="0"
style="
max-width:620px;
background:#fff;
border-radius:20px;
overflow:hidden;
box-shadow:0 12px 40px rgba(0,0,0,.08);
">

<tr>
<td
align="center"
style="
background:#16a34a;
padding:45px;
">

<div
style="
font-size:38px;
font-weight:700;
color:#fff;
">

● Ösztönkód

</div>

<div
style="
margin-top:12px;
font-size:17px;
color:#dff7e7;
">

${subtitle}

</div>

</td>
</tr>

<tr>

<td style="padding:48px;">

<h1
style="
margin:0;
font-size:30px;
color:#111827;
">

${greeting}

</h1>

<div
style="
margin-top:30px;
font-size:17px;
line-height:1.8;
color:#4b5563;
">

${content}

</div>

${
buttonText
? `
<table
align="center"
style="margin:40px auto;">
<tr>
<td
style="
background:#16a34a;
border-radius:12px;
">

<a
href="${buttonUrl}"
style="
display:inline-block;
padding:18px 42px;
font-size:18px;
font-weight:bold;
color:#fff;
text-decoration:none;
">

${buttonText}

</a>

</td>
</tr>
</table>
`
: ""
}

<hr
style="
margin:50px 0;
border:none;
border-top:1px solid #e5e7eb;
">

<div
style="
font-size:14px;
color:#6b7280;
line-height:1.8;
">

${footerNote}

</div>

</td>

</tr>

<tr>

<td
align="center"
style="
background:#f9fafb;
padding:35px;
border-top:1px solid #ececec;
">

<div
style="
font-size:20px;
font-weight:700;
">

● Ösztönkód

</div>

<div
style="
margin-top:8px;
font-size:13px;
color:#6b7280;
line-height:1.8;
">

Ez egy automatikusan küldött rendszerüzenet.<br>
Kérjük, ne válaszolj erre az e-mailre.

</div>

<div style="margin:20px 0;">

<a
href="https://www.osztonkod.hu"
style="
font-size:15px;
font-weight:600;
color:#16a34a;
text-decoration:none;
">

www.osztonkod.hu

</a>

</div>

<div
style="
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