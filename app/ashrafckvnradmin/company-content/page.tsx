import { getCompanyContent } from "@/lib/products";
import CompanyContentEditClient from "./CompanyContentEditClient";

export default async function CompanyContentAdminPage() {
  const company = await getCompanyContent();
  if (!company) return <p>No company content found.</p>;
  return <CompanyContentEditClient company={company} />;
}
