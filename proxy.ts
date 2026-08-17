import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr";

type SessionCookies = Parameters<typeof updateSession>[0];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { accessToken } = await updateSession({
    // Next.js's RequestCookies.set() only takes (name, value) — narrower than the
    // SDK's 3-arg CookieWriter.set() signature, so TS can't verify this structurally.
    requestCookies: request.cookies as unknown as SessionCookies["requestCookies"],
    responseCookies: response.cookies,
  });

  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!accessToken && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (accessToken && isLoginPage) {
    return NextResponse.redirect(new URL("/my-activities", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|ingest|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf)$).*)"],
};
