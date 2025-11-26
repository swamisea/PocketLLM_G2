export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  createdAt?: string; //ISO String
}

export interface CreateUserResponse {
  success: boolean;
  errors?: {
    username?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
  userId?: string;
}

export interface LoginUserRequest{
    email: string;
    password: string;
}

export interface LoginUserResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export interface User{
  id: string;
  email: string;
  username: string;
  theme: 'dark' | 'light';
  createdAt: string; //ISO String
}

export interface ValidationErrors {
  username?: string[];
  email?: string[];
  password?: string[];
}