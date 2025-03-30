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
  skills?: Skill[];
}

export interface Hero {
  id: number;
  name: string;
  tier: string;
  image_url: string | null;
  description?: string;
  role_id: number | null;
  role: string;
  skills?: Skill[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: "passive" | "skill 1" | "skill 2" | "skill 3" | "ultimate" | "special skill";
}