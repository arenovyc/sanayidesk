import "server-only";

type LeadMailInput = {
  name: string;
  shopName: string;
  city: string;
  phone: string;
  email: string;
  note: string;
};

export async function sendLeadEmails(input: LeadMailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "SanayiDesk <onboarding@resend.dev>";
  const notify = process.env.LEADS_NOTIFY_EMAIL?.trim();

  const applicantBody = [
    `Merhaba ${input.name},`,
    "",
    "SanayiDesk başvurun alındı. 24 saat içinde e-posta veya telefonla dönüş yapacağız.",
    "",
    `Dükkan: ${input.shopName}`,
    input.city ? `Şehir: ${input.city}` : null,
    "",
    "— SanayiDesk",
  ]
    .filter((line) => line !== null)
    .join("\n");

  await resend.emails.send({
    from,
    to: input.email,
    subject: "Başvurun alındı — SanayiDesk",
    text: applicantBody,
  });

  if (notify) {
    const notifyBody = [
      "Yeni SanayiDesk başvurusu",
      "",
      `Ad: ${input.name}`,
      `Dükkan: ${input.shopName}`,
      `Şehir: ${input.city || "—"}`,
      `Telefon: ${input.phone || "—"}`,
      `E-posta: ${input.email}`,
      input.note ? `Not: ${input.note}` : null,
    ]
      .filter((line) => line !== null)
      .join("\n");

    await resend.emails.send({
      from,
      to: notify,
      subject: `Başvuru: ${input.shopName}`,
      text: notifyBody,
    });
  }
}
