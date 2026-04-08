"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { isAdmin, adminConfirmOrder, adminToggleProduct } from "../lib/admin";
import { uploadHeroImage } from "../lib/hero-image";

export async function adminConfirmOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  await adminConfirmOrder(orderId);
  redirect("/admin?tab=orders");
}

export async function adminToggleProductAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const active = formData.get("active") === "true";
  await adminToggleProduct(slug, active);
  redirect("/admin?tab=products");
}

export async function adminUploadHeroImageAction(formData: FormData) {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";
  if (!isAdmin(email)) redirect("/");

  const file = formData.get("heroImage");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin?tab=hero&error=no_file");
  }

  if (!file.type.startsWith("image/")) {
    redirect("/admin?tab=hero&error=invalid_type");
  }

  const result = await uploadHeroImage(file);
  if (!result.ok) {
    redirect("/admin?tab=hero&error=upload_failed");
  }

  redirect("/admin?tab=hero&success=1");
}
