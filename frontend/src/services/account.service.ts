import { CreateUserRequest, CreateUserResponse, LoginUserRequest, LoginUserResponse } from "@common/types/account";
import { apiClient } from "../lib/apiClient";

export async function createUser(
  payload: CreateUserRequest
): Promise<CreateUserResponse> {
  const { data } = await apiClient.post<CreateUserResponse>(
    "/api/account/create-user",
    payload
  );
  return data;
}

export async function loginUser(
  payload: LoginUserRequest
): Promise<LoginUserResponse> {
  const { data } = await apiClient.post<LoginUserResponse>(
    "/api/account/login",
    payload
  );
  return data;
}
