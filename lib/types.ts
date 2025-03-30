export interface HeroQueryResult {
  id: number;
  name: string;
  tier: string;
  image_url: string | null;
  description?: string;
  skills?: Skill[];
  hero_roles: Array<{
    role_id: number;
    is_primary: boolean;
    roles: {
      id: number;
      name: string;
      description?: string;
    };
  }>;
}

export interface Hero {
  id: number;
  name: string;
  tier: string;
  image_url: string | null;
  description?: string;
  skills?: Skill[];
  roles: {
    id: number;
    name: string;
    isPrimary: boolean;
  }[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: "passive" | "skill 1" | "skill 2" | "skill 3" | "ultimate" | "special skill";
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}