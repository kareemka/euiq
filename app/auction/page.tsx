import { redirect } from "next/navigation";
import { getAuctionUser } from "@/lib/security";
import AuctionClient from "@/components/AuctionClient";

export default async function AuctionPage() {
  const user = await getAuctionUser();
  if (!user) redirect("/");
  return <AuctionClient name={user.name}/>;
}
