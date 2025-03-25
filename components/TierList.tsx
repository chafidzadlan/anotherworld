"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import Image from "next/image";

interface Hero {
  id: number;
  name: string;
  role: string;
  tier: "S" | "A" | "B" | "C" | "D";
  image: string;
};

const heroData: Hero[] = [
  { id: 1, name: 'Gusion', role: 'Assassin', tier: 'S', image: '/assets/dummy.jpg' },
  { id: 2, name: 'Khufra', role: 'Tank', tier: 'S', image: '/assets/dummy.jpg' },
  { id: 3, name: 'Kagura', role: 'Mage', tier: 'A', image: '/assets/dummy.jpg' },
];

export default function TierList() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const groupedHeroes = heroData.reduce((acc, hero) => {
    if (!acc[hero.tier]) {
      acc[hero.tier] = [];
    }

    if (!selectedRole || hero.role === selectedRole) {
      acc[hero.tier].push(hero);
    }

    return acc;
  }, {} as Record<string, Hero[]>);

  const tierOrder = ["S", "A", "B", "C", "D"];

  return (
    <div className="container mx-auto p-12">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">
              Mobile Legends Tier List
            </div>
            <div className="text-2xl font-bold">
              By C
            </div>
          </div>
          <div className="flex justify-between items-center pt-8">
            <div className="space-x-2 flex-row flex">
              {["Fighter", "Assassin", "Mage", "Tank", "Support", "Marksman"]
                .map((role) => (
                  <Badge
                    key={role}
                    variant={selectedRole === role ? "default" : "outline"}
                    onClick={() => setSelectedRole(selectedRole === role ? null : role)}
                    className="cursor-pointer"
                  >
                    {role}
                  </Badge>
                ))
              }
            </div>
            Search
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full">
            {tierOrder.map((tier) => (
              groupedHeroes[tier]?.length > 0 && (
                <div key={tier} className="mb-4">
                  <div className="flex items-center mb-2">
                    <h2 className={`text-xl font-semibold mr-4 ${
                      tier === "S" ? "text-yellow-500" :
                      tier === "A" ? "text-green-500" :
                      tier === "B" ? "text-blue-500" :
                      tier === "C" ? "text-gray-500" : "text-red-500"
                    }`}>
                      {tier} Tier
                    </h2>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>
                  <div className="grid grid-cols-6 gap-4">
                    {groupedHeroes[tier].map((hero) => (
                      <Card key={hero.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4 flex flex-col items-center">
                          <Image
                            src={hero.image}
                            alt={hero.name}
                            width={48}
                            height={48}
                            className=" object-cover rounded-lg mb-2"
                          />
                          <div className="text-center">
                            <h3 className="font-semibold">{hero.name}</h3>
                            <p className="text-sm text-gray-500">{hero.role}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};