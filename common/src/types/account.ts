export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  createdAt?: string; //ISO String
  preferences?: UserPreferences;
}

export interface CreateUserResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin?: boolean;
  preferences: UserPreferences
}

export interface ValidationErrors {
  username?: string[];
  email?: string[];
  password?: string[];
}

export interface UserPreferences {
  theme: 'dark'|'light';
  model: string;
  temp: number;
  custom_instructions: string;
}