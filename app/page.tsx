import { redirect } from "next/navigation";
import { getAuctionUser } from "@/lib/security";
import Login from "@/components/Login";

export default async function Home() {
  const user = await getAuctionUser();
  if (user) redirect("/auction");
  return <Login />;
}