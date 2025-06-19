export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthError {
  message: string;
}

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInData {
  emailOrPhone: string;
  password: string;
}