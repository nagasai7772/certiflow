import { http } from "../lib/http";
import { API } from "../config/api";
import type { User } from "../types";

type LoginResponse = {
  success?: boolean;
  message?: string;
  data?: { user?: User; token?: string; accessToken?: string; access_token?: string };
  user?: User;
  token?: string;
  accessToken?: string;
  access_token?: string;
};

export async function loginRequest(email: string, password: string) {
  const { data } = await http.post<LoginResponse>(API.login, { email, password });
  const payload = data.data ?? data;
  const token = payload.token ?? payload.accessToken ?? payload.access_token;
  const user = payload.user;
  if (!token || !user) {
    throw new Error("Login response did not contain a user and token. Update auth.service.ts to match your backend response.");
  }
  return { token, user };
}
