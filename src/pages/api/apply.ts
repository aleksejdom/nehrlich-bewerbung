import nodemailer from 'nodemailer';

export const prerender = false; // falls du 'hybrid' nutzt; bei 'server' ok

const transporter = nodemailer.createTransport({
  host: import.meta.env.SMTP_HOST,
  port: Number(import.meta.env.SMTP_PORT || 587),
  secure: false,           // Port 587 = STARTTLS
  requireTLS: true,        // TLS erzwingen (DSGVO/Best Practice)
  auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASS
  }
});

export async function POST({ request, redirect }) {
  const form = await request.formData();

  // Honeypot gegen Bots
  if (String(form.get('website') ?? '').trim() !== '') {
    return new Response('Bad request', { status: 400 });
  }

  const payload = {
    standort: String(form.get('standort') ?? ''),
    ausbildung: String(form.get('ausbildung') ?? ''),
    erfahrung: String(form.get('erfahrung') ?? ''),
    abschluss: String(form.get('abschluss') ?? ''), // NEU
    erreichbarkeit: form.getAll('erreichbarkeit').map(String),
    name: String(form.get('name') ?? ''),
    email: String(form.get('email') ?? ''),
    telefon: String(form.get('telefon') ?? '')
  };

  // Pflichtfelder prüfen
  if (!payload.standort || !payload.ausbildung || !payload.erfahrung || !payload.name || !payload.email || !payload.telefon) {
    return new Response('Bitte alle Pflichtfelder ausfüllen.', { status: 422 });
  }

  // NEU: Wenn "Keine Erfahrung", Abschluss zwingend
  if (payload.erfahrung === 'Keine Erfahrung' && !payload.abschluss) {
    return new Response('Bitte gib an, wann du deine Ausbildung/Studium abschließt.', { status: 422 });
  }

  const subject = `Neue Bewerbung (${payload.standort}) – ${payload.name}`;
  const lines = [
    `Standort: ${payload.standort}`,
    `Ausbildung: ${payload.ausbildung}`,
    `Erfahrung: ${payload.erfahrung}`, 
    `Abschluss (bei keiner Erfahrung): ${payload.abschluss || '-'}`, // NEU
    `Erreichbarkeit: ${payload.erreichbarkeit.join(', ') || '-'}`,
    `Name: ${payload.name}`,
    `E-Mail: ${payload.email}`,
    `Telefon: ${payload.telefon}`
  ];
  const text = lines.join('\n');
  const html = `<pre style="font:14px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">${text}</pre>`;

  try {
    await transporter.sendMail({
      from: import.meta.env.SMTP_FROM, // z. B. "Bewerbung <dev@ita-staging.de>"
      to: import.meta.env.SMTP_TO,     // Zieladresse(n), kommasepariert möglich
      replyTo: payload.email,          // Antworten gehen an Bewerber:in
      subject,
      text,
      html
    });
  } catch (err) {
    console.error('SMTP send failed:', err);
    return new Response('Mailversand fehlgeschlagen.', { status: 500 });
  }

  // Erfolg → Danke-Seite
  return redirect('/erfolg', 303);
}
