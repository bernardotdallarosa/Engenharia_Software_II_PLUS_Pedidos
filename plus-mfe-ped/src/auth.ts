type JwtPayload = {
  sub?: string;
  role?: string;
};

export function getAuthToken(): string | null {
  return localStorage.getItem("plus.auth.token");
}

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserRole(): string | null {
  const token = getAuthToken();
  if (!token) return null;
  return parseJwtPayload(token)?.role ?? null;
}
