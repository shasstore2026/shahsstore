import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * Public branding endpoint.
 *
 * Returns the singleton site_branding row so the (client-side) Navbar can
 * swap its wordmark for an uploaded logo image. RLS allows anon SELECT.
 */
export async function GET() {
  const { data, error } = await supabase
    .from("site_branding")
    .select("logo_image, wordmark_image, brand_text, brand_subtext, logo_alt, logo_height_px")
    .single();

  if (error) {
    return NextResponse.json(
      {
        logo_image: "",
        wordmark_image: "",
        brand_text: "Shasstore",
        brand_subtext: "by shahanas",
        logo_alt: "Shasstore",
        logo_height_px: 44,
      },
      { status: 200 },
    );
  }
  return NextResponse.json(data);
}
