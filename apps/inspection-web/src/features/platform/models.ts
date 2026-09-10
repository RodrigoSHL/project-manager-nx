export interface PlatformTenant {
  id: string;
  code: string;
  name: string;
  active: boolean;
  siteCount: number;
  assetCount: number;
  workCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformUser {
  userId: string;
  email: string;
  name: string;
  roles: string[];
}

export interface PlatformSession {
  accessToken: string;
  user: PlatformUser;
}
