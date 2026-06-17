export interface LoginResponse {
  token?:   string;
  refresh?: string;
  user?:   AuthUser;

  access_token?: string;
  refresh_token?: string;
}

export interface AuthUser {
  id:        string;
  email:     string;
  name?:     string;
  avatarUrl?: string;
}

export interface LoginCredentials {
  email:    string;
  password: string;
}