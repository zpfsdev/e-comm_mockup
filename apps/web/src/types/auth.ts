export interface AuthUser {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roles: string[];
  hasStore?: boolean;
  seller?: {
    shopName: string;
    shopLogoUrl?: string;
  };
  profilePictureUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  csrfToken?: string;
  user: AuthUser;
}
