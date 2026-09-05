import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdmin } from "@/lib/security";
import ProductForm from "@/components/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await getAdmin()) redirect("/admin/login");
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) redirect("/admin");
  return (
    <ProductForm
      initial={{
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        openingPrice: product.openingPrice,
        reservePrice: product.reservePrice,
        bidIncrement: product.bidIncrement,
        startsAt: product.startsAt.toISOString(),
        endsAt: product.endsAt.toISOString(),
        active: product.active,
        blurImage: product.blurImage
      }}
    />
  );
}