"use client"

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Hero, Skill } from "@/lib/types";
import Image from "next/image";
import { Star, Zap } from "lucide-react";

interface HeroDetailDialogProps {
  hero: Hero | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HeroDetailDialog({ hero, open, onOpenChange }: HeroDetailDialogProps) {
  if (!hero) return null;

  const skills = hero.skills || [];

  const tierColors = {
    S: "border-yellow-400 text-yellow-600 bg-yellow-50",
    A: "border-green-400 text-green-600 bg-green-50",
    B: "border-blue-400 text-blue-600 bg-blue-50",
    C: "border-gray-400 text-gray-600 bg-gray-50",
    D: "border-red-400 text-red-600 bg-red-50",
  };

  const roleColors = {
    "Fighter": "bg-red-100 text-red-600 border-red-200",
    "Assassin": "bg-purple-100 text-purple-600 border-purple-200",
    "Mage": "bg-blue-100 text-blue-600 border-blue-200",
    "Tank": "bg-green-100 text-green-600 border-green-200",
    "Support": "bg-yellow-100 text-yellow-600 border-yellow-200",
    "Marksman": "bg-orange-100 text-orange-600 border-orange-200"
  };

  const getRoleBadgeStyle = (roleName: string, isPrimary: boolean) => {
    const baseStyle = roleColors[roleName as keyof typeof roleColors] || "bg-gray-100 text-gray-600 border-gray-200";
    return isPrimary
      ? `${baseStyle} font-semibold border-2`
      : `${baseStyle}`;
  };

  const skillsByType = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const type = skill.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(skill);
    return acc;
  }, {});

  const skillTypes = Object.keys(skillsByType);
  const defaultTab = skillTypes.length > 0 ? skillTypes[0] : "";

  const renderSkillCard = (skill: Skill) => (
    <div key={skill.id} className="p-3 bg-gray-50 rounded-md mb-2">
      <h4 className="font-medium text-sm">{skill.name}</h4>
      <p className="text-xs text-gray-600 mt-1">{skill.description}</p>
    </div>
  );

  const getSkillIcon = (type: string) => {
    if (type === "passive") return <Star className="h-4 w-4 mr-1 text-yellow-500" />
    return <Zap className="h-4 w-4 mr-1 text-blue-500" />
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hero.name}
            <div className="ml-4 flex items-center gap-2">
              <Badge
                className={`${tierColors[hero.tier as keyof typeof tierColors] || "border-gray-200 bg-gray-100 text-gray-500"}`}
              >
                {hero.tier}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {hero.image_url ? (
                <Image
                  src={hero.image_url || "/placeholder.svg"}
                  alt={hero.name}
                  width={120}
                  height={120}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-[120px] h-[120px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  {hero.roles.map(role => (
                    <Badge
                      key={role.id}
                      className={getRoleBadgeStyle(role.name, role.isPrimary)}
                    >
                      {role.name}{role.isPrimary && " (Primary)"}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{hero.description || "No description available."}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills & Abilities</h3>
              {skills.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center text-muted-foreground">
                    No skills information available.
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue={defaultTab} className="w-full">
                  <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${skillTypes.length}, 1fr)` }}>
                    {skillTypes.map((type) => (
                      <TabsTrigger key={type} value={type} className="flex items-center">
                        {getSkillIcon(type)}
                        <span className="capitalize">{type}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {skillTypes.map((type) => (
                    <TabsContent key={type} value={type} className="space-y-2 mt-2">
                      {skillsByType[type].map(renderSkillCard)}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};