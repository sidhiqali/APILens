export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface ValidatedUser {
  userId: string;
  email: string;
}
