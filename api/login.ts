// Vercel Serverless Function for Admin Authentication
export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido" });
  }

  const { password } = req.body || {};
  const adminPassword = process.env.VERCEL_ADMIN_PASSWORD || "a120780";

  if (password === adminPassword) {
    return res.status(200).json({ success: true, token: "admin_token_session_verified_2026" });
  } else {
    return res.status(401).json({ success: false, error: "Senha administrativa incorreta." });
  }
}
