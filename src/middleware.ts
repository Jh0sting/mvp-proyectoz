import { type NextRequest, NextResponse } from "next/server";

// El panel del arquitecto se protege con usuario y contraseña (HTTP Basic).
// Usuario: ADMIN_USER (por defecto "socio"); contraseña: ADMIN_PASSWORD.
export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("El panel está desactivado: falta configurar ADMIN_PASSWORD.", { status: 503 });
  }
  const user = process.env.ADMIN_USER ?? "socio";
  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const [u, ...rest] = atob(encoded).split(":");
    if (u === user && rest.join(":") === password) return NextResponse.next();
  }
  return new NextResponse("Se requiere usuario y contraseña.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Panel Proyecto Z", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
