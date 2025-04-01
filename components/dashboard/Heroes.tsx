"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Info, Loader2, MoreVertical, Pencil, Trash, X } from "lucide-react";
import Image from "next/image";
import { HeroCreateDialog } from "@/components/dashboard/HeroCreateDialog";
import { HeroDetailDialog } from "@/components/dashboard/HeroDetailDialog";
import { HeroEditDialog } from "@/components/dashboard/HeroEditDialog";
import type { Hero, HeroQueryResult } from "@/lib/types";
import { Pagination } from "@/components/Pagination";

const ITEMS_PER_PAGE = 5;

export default function Heroes() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalHeroes, setTotalHeroes] = useState(0);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchHeroes();
  }, [searchTerm, currentPage]);

  const fetchHeroes = async () => {
    setIsLoading(true);

    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("heroes")
        .select(`
          id,
          name,
          tier,
          image_url,
          description,
          skills,
          hero_roles(
            role_id,
            is_primary,
            roles(id, name, description)
          )
        `, { count: "exact" });

      if (searchTerm.trim()) {
        query = query.ilike("name", `%${searchTerm.trim()}%`);
      }

      query = query.order("id").range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      setTotalHeroes(count || 0);

      if (count !== null) {
        setTotalHeroes(count);
      }

      const processedHeroes: Hero[] = (data as unknown as HeroQueryResult[]).map(hero => ({
        id: hero.id,
        name: hero.name,
        tier: hero.tier,
        image_url: hero.image_url,
        description: hero.description,
        skills: hero.skills,
        roles: hero.hero_roles.map(hr => ({
          id: hr.role_id,
          name: hr.roles.name,
          isPrimary: hr.is_primary,
        }))
      }));

      setHeroes(processedHeroes);
    } catch (err) {
      toast.error("Failed to fetch heroes", {
        description: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHeroDetails = (hero: Hero) => {
    setSelectedHero(hero);
    setIsDetailDialogOpen(true);
  };

  const handleEditHero = (hero: Hero) => {
    setSelectedHero(hero);
    setIsEditDialogOpen(true);
  };

  const handleDeleteHero = () => {
    toast.info("Coming Soon", {
      description: "Delete hero functionality will be available soon!",
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const renderTierBadge = (tier: string) => {
    const tierColors = {
      "S": "bg-yellow-500 text-white",
      "A": "bg-green-500 text-white",
      "B": "bg-blue-500 text-white",
      "C": "bg-gray-500 text-white",
      "D": "bg-red-500 text-white"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tierColors[tier as keyof typeof tierColors] || "bg-gray-200"}`}>
        {tier} Tier
      </span>
    );
  };

  const totalPages = Math.ceil(totalHeroes / ITEMS_PER_PAGE);

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="text-center pb-4">
          <CardTitle>Heroes Information</CardTitle>
          <CardDescription>View and manage heroes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center gap-2">
              <div className="flex space-x-2 w-full">
                <Input
                  placeholder="Search heroes by name..."
                  className="max-w-56"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="flex items-center"
                >
                <X className="h-4 w-4" />
                </Button>
              </div>
              <HeroCreateDialog onHeroCreated={fetchHeroes} />
            </div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">#</TableHead>
                    <TableHead className="w-[150px] px-5">Image</TableHead>
                    <TableHead className="w-[250px]">Name</TableHead>
                    <TableHead className="w-[150px]">Role</TableHead>
                    <TableHead className="w-[50px]">Tier</TableHead>
                    <TableHead className="w-[50px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : heroes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No heroes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    heroes.map((hero, index) => (
                      <TableRow key={hero.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="text-center font-medium text-gray-500">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell>
                          {hero.image_url ? (
                            <Image
                              src={hero.image_url}
                              alt={hero.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 object-cover rounded-4xl shadow-sm"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                              No Image
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{hero.name}</span>
                        </TableCell>
                        <TableCell>
                          {hero.roles.length > 0 ? (
                            <span className="text-gray-600">
                              {hero.roles.find(r => r.isPrimary)?.name} {hero.roles.find(r => !r.isPrimary)?.name}
                            </span>
                          ) : (
                            <span className="italic text-gray-400">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {renderTierBadge(hero.tier)}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewHeroDetails(hero)}>
                                <Info className="h-4 w-4 mr-2" /> Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditHero(hero)}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit Hero
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteHero()}>
                                <Trash className="h-4 w-4 mr-2" /> Delete Hero
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>
      <HeroDetailDialog
        hero={selectedHero}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
      <HeroEditDialog
        hero={selectedHero}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onHeroUpdated={fetchHeroes}
      />
    </>
  );
}