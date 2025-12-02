const { VITE_API_URL } = import.meta.env;

export const env = {
  apiUrl: (VITE_API_URL as string | undefined) || "http://localhost:8080",
};
