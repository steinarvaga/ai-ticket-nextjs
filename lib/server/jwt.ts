import "server-only";
import { getEnvVariable } from "@/lib/env";
import { jwtVerify, SignJWT, JWTPayload } from "jose";

export function signJWT(
  payload: { sub: string },
  options: { exp: string }
): Promise<string> {
  try {
    const alg = "HS256";
    const secret = new TextEncoder().encode(getEnvVariable("JWT_SECRET"));

    return new SignJWT(payload)
      .setProtectedHeader({ alg })
      .setExpirationTime(options.exp)
      .setIssuedAt()
      .setSubject(payload.sub)
      .sign(secret);
  } catch (error) {
    console.error("Wasn't able to sign the token.", error);
    throw new Error("Wasn't able to sign the token.");
  }
}

export async function verifyJWT(token: string): Promise<JWTPayload | false> {
  const secret = new TextEncoder().encode(getEnvVariable("JWT_SECRET"));
  if (!token) {
    return false;
  }

  try {
    const jwt = await jwtVerify(token, secret);
    return jwt.payload;
  } catch (error) {
    if (error instanceof Error) {
      console.log("verifyJWT:", error.message);
    }
    return false;
  }
}
