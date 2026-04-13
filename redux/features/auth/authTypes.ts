export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    country_code: string | null;
    phone_number: string | null;
    type: string;
    gender: string | null;
    date_of_birth: string | null;
    created_at: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface LoginResponseBody {
    success?: boolean;
    message?: string;
    authorization?: {
      type?: string;
      access_token: string;
      refresh_token: string;
    };
    access_token?: string;
    refresh_token?: string;
  }
  
  export interface MeResponseBody {
    success?: boolean;
    data?: User;
    message?: string;
  }
  
  export interface AuthState {
    user: User | null;
    isHydrated: boolean;
  }export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  country_code: string | null;
  phone_number: string | null;
  type: string;
  gender: string | null;
  date_of_birth: string | null;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponseBody {
  success?: boolean;
  message?: string;
  authorization?: {
    type?: string;
    access_token: string;
    refresh_token: string;
  };
  access_token?: string;
  refresh_token?: string;
}

export interface MeResponseBody {
  success?: boolean;
  data?: User;
  message?: string;
}

export interface AuthState {
  user: User | null;
  isHydrated: boolean;
}