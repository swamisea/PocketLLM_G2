// frontend/src/services/account.service.ts
import type { CreateUserRequest, LoginUserRequest, CreateUserResponse, LoginUserResponse } from "@common/types/account";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function createUser(
  payload: CreateUserRequest
): Promise<CreateUserResponse> {
  const res = await fetch(`${API_URL}/api/account/create-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    // Return error response structure for consistency
    return {
      success: false,
      message: data.message || "Failed to create account",
      errors: data.errors,
    };
  }
  
  return data as CreateUserResponse;
}

export async function loginUser(
  payload: LoginUserRequest
): Promise<LoginUserResponse> {
  const res = await fetch(`${API_URL}/api/account/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    return {
      success: false,
      message: data.message || "Login failed",
    };
  }
  
  return data as LoginUserResponse;
}