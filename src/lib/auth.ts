import crypto from "crypto";

export const getAdminToken = () => {
  const password = process.env.ADMIN_PASSWORD || "admin";
  return crypto.createHash("sha256").update(password).digest("hex");
};

export const isAuthenticated = (cookies: any) => {
  const token = cookies.get("admin_session")?.value;
  return token === getAdminToken();
};

export const isRequestAuthenticated = (request: Request) => {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  if (!match) return false;
  return match[1] === getAdminToken();
};
