import jwt, { type SignOptions } from "jsonwebtoken";

interface AccessTokenPayload {
  userId: string;
  role: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  return secret;
};

export const generateAccessToken = (payload: AccessTokenPayload) => {
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN ||
    "15m") as SignOptions["expiresIn"];

  return jwt.sign(
    { role: payload.role },
    getJwtSecret(),
    {
      subject: payload.userId,
      expiresIn,
    }
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, getJwtSecret());
};