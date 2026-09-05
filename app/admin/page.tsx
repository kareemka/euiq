import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/security";
import AdminClient from "@/components/AdminClient";
export default async function AdminPage(){const admin=await getAdmin();if(!admin)redirect("/admin/login");return <AdminClient email={admin.email}/>}
