"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { HeroImageUpload } from "@/components/dashboard/HeroImageUpload";
import { Skill, Role } from "@/lib/types";

interface HeroFormData {
  name: string;
  roles: {
    id: number;
    name: string;
    isPrimary: boolean;
  }[];
  tier: string;
  imageUrl: string | null;
  description: string;
  skills: Skill[];
}

const HERO_TIERS = ['S', 'A', 'B', 'C', 'D'] as const;
type HeroTier = typeof HERO_TIERS[number];

const SKILL_TYPES = [
  "passive",
  "skill 1",
  "skill 2",
  "skill 3",
  "ultimate",
  "special skill"
] as const;

interface HeroCreateDialogProps {
  onHeroCreated?: () => void;
}

export function HeroCreateDialog({ onHeroCreated }: HeroCreateDialogProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<HeroFormData>({
    name: "",
    roles: [],
    tier: "",
    imageUrl: null,
    description: "",
    skills: [],
  });
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    id: "",
    name: "",
    description: "",
    type: "passive",
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("id, name, description")
        .order("id", { ascending: true });
      if (error) throw error;

      setRoles(data || []);
    } catch (error) {
      toast.error("Failed to fetch roles", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    };
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = `hero-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("hero-storage")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("hero-storage").getPublicUrl(filePath);
      return data?.publicUrl || null;
    } catch (error) {
      toast.error("Image upload failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      return null;
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleSelect = (roleId: number, roleName: string) => {
    setFormData(prev => {
      const roleIndex = prev.roles.findIndex(r => r.id === roleId);
      let updatedRoles;
      if (roleIndex >= 0) {
        updatedRoles = prev.roles.filter(r => r.id !== roleId);
      } else {
        if (prev.roles.length >= 3) {
          toast.error("Maximum 3 roles can be selected");
          return prev;
        }

        const isPrimary = prev.roles.length === 0;
        updatedRoles = [...prev.roles, { id: roleId, name: roleName, isPrimary }];
      }

      return { ...prev, roles: updatedRoles };
    });
  };

  const handleSetPrimaryRole = (roleId: number) => {
    setFormData(prev => {
      const updatedRoles = prev.roles.map(role => ({
        ...role,
        isPrimary: role.id === roleId
      }));

      return { ...prev, roles: updatedRoles };
    });
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSkill(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSkill = () => {
    if (!newSkill.name || !newSkill.description || !newSkill.type) {
      toast.error("Please fill in all skill fields");
      return;
    };

    const skill: Skill = {
      id: newSkill.id || `skill-${Date.now()}`,
      name: newSkill.name,
      description: newSkill.description,
      type: newSkill.type as Skill["type"],
    };

    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, skill],
    }));

    setNewSkill({
      id: "",
      name: "",
      description: "",
      type: "passive"
    });
  };

  const handleRemoveSkill = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== skillId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.roles.length === 0 || !formData.tier) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.roles.length > 3) {
      toast.error("Maximum 3 roles can be selected");
      return;
    }

    if (!formData.roles.some(r => r.isPrimary)) {
      setFormData(prev => {
        const updatedRoles = [...prev.roles];
        if (updatedRoles.length > 0) {
          updatedRoles[0].isPrimary = true;
        }
        return { ...prev, roles: updatedRoles };
      });
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      };

      const { data: heroData, error: heroError } = await supabase
        .from("heroes")
        .insert({
          name: formData.name,
          tier: formData.tier,
          image_url: imageUrl,
          description: formData.description || null,
          skills: formData.skills.length > 0 ? formData.skills : null
        })
        .select("id")
        .single();

      if (heroError) throw heroError;

      const heroRolesData = formData.roles.map(role => ({
        hero_id: heroData.id,
        role_id: role.id,
        is_primary: role.isPrimary
      }));

      const { error: rolesError } = await supabase
        .from("hero_roles")
        .insert(heroRolesData);

      if (rolesError) throw rolesError;

      toast.success("Hero created successfully");
      resetForm();
      onHeroCreated?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create hero";
      toast.error("Hero Creation Failed", { description: errorMessage });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    };
  };

  const resetForm = () => {
    setFormData({
      name: "",
      roles: [],
      tier: "",
      imageUrl: null,
      description: "",
      skills:[],
    });
    setNewSkill({
      id: "",
      name: "",
      description: "",
      type: "passive",
    });
    setImageFile(null);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" /> Create Hero
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Hero</DialogTitle>
          <DialogDescription>Fill out the details to add a new hero to the game.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Hero Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter hero name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select
                value={formData.tier}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  tier: value as HeroTier,
                }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hero tier" />
                </SelectTrigger>
                <SelectContent>
                  {HERO_TIERS.map(tier => (
                    <SelectItem key={tier} value={tier}>
                      {tier} Tier
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Roles (Select up to 3)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.roles.map(role => (
                <Badge
                  key={role.id}
                  variant={role.isPrimary ? "default" : "outline"}
                  className="flex items-center gap-1 px-2 py-1"
                >
                  <span>{role.name}</span>
                  {role.isPrimary && <span className="text-xs">(Primary)</span>}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => {
                      const updatedRoles = formData.roles.filter(r => r.id !== role.id);
                      setFormData(prev => ({ ...prev, roles: updatedRoles }));
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <ScrollArea className="h-40 border rounded-md p-2">
              {roles.map(role => {
                const isSelected = formData.roles.some(r => r.id === role.id);
                const isPrimary = formData.roles.find(r => r.id === role.id)?.isPrimary || false;

                return (
                  <div key={role.id} className="flex items-center justify-between py-2 px-1 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleRoleSelect(role.id, role.name)}
                      />
                      <Label htmlFor={`role-${role.id}`} className="font-normal cursor-pointer">
                        {role.name}
                      </Label>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`primary-${role.id}`}
                          checked={isPrimary}
                          onCheckedChange={() => handleSetPrimaryRole(role.id)}
                          disabled={!isSelected}
                        />
                        <Label htmlFor={`primary-${role.id}`} className="text-xs font-normal cursor-pointer">
                          Primary
                        </Label>
                      </div>
                    )}
                  </div>
                );
              })}
            </ScrollArea>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Hero Image</Label>
              <HeroImageUpload
                onImageSelect={(file) => {
                  setImageFile(file);
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter hero description"
              rows={3}
            />
          </div>
          <div className="space-y-4 border p-4 rounded-md">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Hero Skills</h3>
            </div>
            {formData.skills.length > 0 && (
              <div className="space-y-2">
                <Label>Current Skills</Label>
                <div className="space-y-2 max-h-48 overflow-x-auto p-2 border rounded-md">
                  {formData.skills.map(skill => (
                    <div key={skill.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div>
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({skill.type})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(skill.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Add New Skill</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  name="name"
                  value={newSkill.name}
                  onChange={handleSkillInputChange}
                  placeholder="Skill name"
                />
                <Select
                  value={newSkill.type}
                  onValueChange={(value) => setNewSkill(prev => ({
                    ...prev,
                    type: value as Skill["type"]
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Skill type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                name="description"
                value={newSkill.description}
                onChange={handleSkillInputChange}
                placeholder="Skill description"
                rows={2}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSkill}
                className="w-full"
              >
                Add Skill
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Hero"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}