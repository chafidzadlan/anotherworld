import { Header } from "@/components/Header";
import TierList from "@/components/TierList";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <Header />
      <TierList />
    </main>
  );
};
