const { VITE_API_URL } = import.meta.env;

export const env = {
  apiUrl: (VITE_API_URL as string | undefined) || "http://localhost:8080",
  defaultModel: "gemma3:270m",
  defaultTemperature: 1.0,
};
