/**
 * Normalises a phone number to international form (+9639xxxxxxxx).
 * Accepts Syrian local numbers (09xxxxxxxx), 00963…, 963…, or any +country number.
 * Returns null when the input can't be a real phone number.
 */
export function normalizePhone(input: string): string | null {
  const digitsMap: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  };
  let s = input.trim().replace(/[٠-٩]/g, (d) => digitsMap[d] ?? d);
  s = s.replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);

  if (/^09\d{8}$/.test(s)) return "+963" + s.slice(1);
  if (/^9\d{8}$/.test(s)) return "+963" + s;
  if (/^963\d{9}$/.test(s)) return "+" + s;
  if (/^\+\d{8,15}$/.test(s)) return s;
  return null;
}

/** wa.me link for a stored phone number. */
export function whatsappLink(phone: string | null) {
  if (!phone) return "#";
  return `https://wa.me/${phone.replace(/^\+/, "")}`;
}

/** +963933123456 → "0933 123 456" (how Syrians write numbers); other countries unchanged. */
export function displayPhone(phone: string | null) {
  if (!phone) return "—";
  const m = /^\+963(\d{3})(\d{3})(\d{3})$/.exec(phone);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : phone;
}
