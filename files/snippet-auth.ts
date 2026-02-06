export interface Session {
  token: string;
  expiresAt: number;
}

export function isExpired(session: Session): boolean {
  return Date.now() > session.expiresAt;
}

export function getAuthHeader(session: Session): Record<string, string> {
  if (isExpired(session)) {
    throw new Error("Session expired");
  }
  return { Authorization: `Bearer ${session.token}` };
}
