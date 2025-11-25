export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  createdAt: string; //ISO String
}

export interface LoginUserRequest{
    email: string;
    password: string;
}

export interface User{
  id: string;
  email: string;
  username: string;
  password: string;
  theme: 'dark' | 'light';
  createdAt: string; //ISO String
}