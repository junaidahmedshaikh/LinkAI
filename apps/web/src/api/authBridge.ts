type SessionExpiredListener = () => void;

let sessionExpiredListener: SessionExpiredListener | null = null;

export function onAuthSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListener = listener;
  return () => {
    if (sessionExpiredListener === listener) {
      sessionExpiredListener = null;
    }
  };
}

export function emitAuthSessionExpired(): void {
  sessionExpiredListener?.();
}
