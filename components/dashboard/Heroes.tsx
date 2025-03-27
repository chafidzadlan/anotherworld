"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, MoreVertical } from "lucide-react";
import Image from "next/image";
import { HeroCreateDialog } from "@/components/dashboard/HeroCreateDialog";
import { Hero, HeroQueryResult } from "@/lib/types";

export default function Heroes() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHeroes();
  }, []);

  const fetchHeroes = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("heroes")
        .select(`
          id,
          name,
          tier,
          image_url,
          description,
          role_id,
          roles (role)
        `);
      if (error) throw error;

      const heroesData: Hero[] = (data as HeroQueryResult[]).map(hero => ({
        ...hero,
        role: hero.roles?.role || "Unknown"
      }));

      setHeroes(heroesData);
    } catch (err) {
      toast.error("Failed to fetch heroes", {
        description: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHeroes = heroes.filter(hero =>
    hero.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hero.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hero.tier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="text-center pb-4">
        <CardTitle>Heroes Information</CardTitle>
        <CardDescription>View and manage heroes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4 gap-2">
          <Input
            placeholder="Search heroes..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <HeroCreateDialog onHeroCreated={fetchHeroes} />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredHeroes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No heroes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredHeroes.map((hero, index) => (
                  <TableRow key={hero.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{hero.name}</TableCell>
                    <TableCell>{hero.role}</TableCell>
                    <TableCell>{hero.tier}</TableCell>
                    <TableCell>
                      {hero.image_url ? (
                        <Image
                          src={hero.image_url}
                          alt={hero.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        "No Image"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};