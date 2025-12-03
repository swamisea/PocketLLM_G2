export const queryKeys = {
  account: {
    me: ["account", "me"] as const,
    guestAvailable: ["account", "guest-available"] as const,
    adminAvailable: ["account", "admin-available"] as const,
  },
  telemetry: {
    recent: ["telemetry", "recent"] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    list: () => ["sessions", "list"] as const,
    byId: (id: string) => ["sessions", "detail", id] as const,
  },
  chat: {
    bySession: (id: string) => ["chat", "session", id] as const,
  },
};
