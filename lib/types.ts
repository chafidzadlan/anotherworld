export interface HeroQueryResult {
  id: number;
  name: string;
  tier: string;
  image_url: string | null;
  description?: string;
  role_id: number | null;
  roles: {
    role?: string;
  } | null;
}

export interface Hero {
  id: number;
  name: string;
  tier: string;
  image_url: string | null;
  description?: string;
  role_id: number | null;
  role: string;
}