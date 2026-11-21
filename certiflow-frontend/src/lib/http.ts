import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("certiflow_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("certiflow_token");
      localStorage.removeItem("certiflow_user");
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
