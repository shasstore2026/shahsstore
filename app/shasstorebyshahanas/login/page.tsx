import type { Metadata } from "next";
import LoginForm from "./LoginForm";

// Anonymise the tab title and disable indexing — if the URL is shared,
// the page should not betray which site it belongs to.
export const metadata: Metadata = {
  title: "Sign In",
  description: "",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <LoginForm />;
}
