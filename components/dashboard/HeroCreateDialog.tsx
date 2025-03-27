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
import { Loader2, Plus } from "lucide-react";
import { HeroImageUpload } from "@/components/dashboard/HeroImageUpload";

interface Role {
  id: number;
  role: string;
}

interface HeroFormData {
  name: string;
  role: string;
  tier: string;
  imageUrl: string;
  description: string;
}

const HERO_TIERS = ['S', 'A', 'B', 'C', 'D'] as const;
type HeroTier = typeof HERO_TIERS[number];

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
    role: "",
    tier: "",
    imageUrl: "",
    description: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.role || !formData.tier) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("role", formData.role)
        .single();
      if (roleError || !roleData) throw new Error("Role not found");

      let imageUrl = null;
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      };

      const { error } = await supabase.from("heroes").insert({
        name: formData.name,
        role_id: roleData.id,
        tier: formData.tier,
        image_url: imageUrl,
        description: formData.description || null,
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
      role: "",
      tier: "",
      imageUrl: "",
      description: ""
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
      <DialogContent className="sm:max-w-[600px]">
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
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  role: value
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
                      value={role.role}
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
                  setFormData(prev => ({
                    ...prev,
                    imageUrl: URL.createObjectURL(file)
                  }));
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