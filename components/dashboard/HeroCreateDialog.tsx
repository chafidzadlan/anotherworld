"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { HeroImageUpload } from "@/components/dashboard/HeroImageUpload";
import { Skill } from "@/lib/types";

interface Role {
  id: number;
  role: string;
}

interface HeroFormData {
  name: string;
  role_id: number | null;
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
    role_id: null,
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
        .select("id, role")
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

    if (!formData.name || !formData.role_id || !formData.tier) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      };

      const { error } = await supabase.from("heroes").insert({
        name: formData.name,
        role_id: formData.role_id,
        tier: formData.tier,
        image_url: imageUrl,
        description: formData.description || null,
        skills: formData.skills.length > 0 ? formData.skills : null
      });

      if (error) throw error;

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
      role_id: null,
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
              <Label>Role</Label>
              <Select
                value={formData.role_id?.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  role_id: parseInt(value)
                }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hero role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem
                      key={role.id}
                      value={role.id.toString()}
                    >
                      {role.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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