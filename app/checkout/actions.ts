"use server";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProduct } from "../lib/catalog";
import { sendPurchaseEmail } from "../lib/email";
import { createOrder, type OrderStatus, type PaymentMethod } from "../lib/orders";
import { upsertProfile } from "../lib/profiles";

function getUserEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  return user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";
}

export async function createCheckoutOrder(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const productSlug = String(formData.get("product") ?? "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "") as PaymentMethod;
  const product = await getProduct(productSlug);
  const email = getUserEmail(user);

  if (!product || !email) {
    redirect(`/checkout?product=${productSlug}&error=invalid`);
  }

  const status: OrderStatus =
    paymentMethod === "bank_transfer" ? "bank_transfer_pending" : "confirmed";

  await upsertProfile({
    id: user.id,
    email,
    fullName: user.fullName,
    imageUrl: user.imageUrl
  });

  const result = await createOrder({
    userId: user.id,
    userEmail: email,
    product,
    paymentMethod,
    status
  });

  if (!result.ok || !result.order) {
    redirect(`/checkout?product=${product.slug}&error=order`);
  }

  if (result.order.status === "confirmed") {
    await sendPurchaseEmail({ to: email, order: result.order });
  }

  redirect(`/checkout/complete?method=${result.order.status}`);
}
