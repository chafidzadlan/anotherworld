"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export function Header() {
  const admin = false;
  const user = true;

  return (
    <header className="sticky top-0 z-40 p-4 border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-primary transition-colors">
          Another World
        </Link>
        <div className="flex items-center gap-4">
          ThemeToggle
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt="" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {admin && (
                  <DropdownMenuItem>
                    Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Link href="/heroes" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Heroes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/guides" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Guides
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {!user && (
            <>
              <Link href="/login">
                Login
              </Link>
              <Link href="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};