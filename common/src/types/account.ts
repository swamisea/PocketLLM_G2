export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
  message?: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  createdAt?: string; //ISO String
}

export interface CreateUserResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
  message?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface ValidationErrors {
  username?: string[];
  email?: string[];
  password?: string[];
}