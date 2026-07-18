export function decodeJwtPayload<T>(token: string): T | null {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as T;
  } catch {
    return null;
  }
}
