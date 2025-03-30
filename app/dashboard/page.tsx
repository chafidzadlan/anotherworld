import Heroes from "@/components/dashboard/Heroes";
import Item from "@/components/dashboard/Item";
import Role from "@/components/dashboard/Role";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Admin() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="container mx-auto p-4 flex-1">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
          </Link>
          <h1 className="text-2xl font-bold text-center mb-4">Admin Dashboard</h1>
          <Tabs defaultValue="heroes" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-md">
              <TabsTrigger value="heroes">Heroes</TabsTrigger>
              <TabsTrigger value="item">Item</TabsTrigger>
              <TabsTrigger value="role">Role</TabsTrigger>
            </TabsList>
            <TabsContent value="heroes">
              <Heroes />
            </TabsContent>
            <TabsContent value="item">
              <Item />
            </TabsContent>
            <TabsContent value="role">
              <Role />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};