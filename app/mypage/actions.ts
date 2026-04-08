"use server";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateUsername, upsertProfile } from "../lib/profiles";
import { confirmBankTransferOrder } from "../lib/orders";
import { sendPurchaseEmail } from "../lib/email";

function getUserEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  return user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";
}

export async function saveUsername(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const email = getUserEmail(user);
  const username = String(formData.get("username") ?? "");

  if (!email) {
    redirect("/mypage?profile=invalid");
  }

  await upsertProfile({
    id: user.id,
    email,
    fullName: user.fullName,
    imageUrl: user.imageUrl
  });

  const result = await updateUsername(user.id, username);

  revalidatePath("/mypage");

  if (!result.ok) {
    redirect("/mypage?profile=error");
  }

  redirect("/mypage?profile=saved");
}

export async function confirmPendingOrder(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const orderId = String(formData.get("orderId") ?? "");
  const email = getUserEmail(user);

  if (!orderId) {
    redirect("/mypage?order=invalid");
  }

  const result = await confirmBankTransferOrder({
    orderId,
    userId: user.id
  });

  if (!result.ok || !result.order) {
    redirect("/mypage?order=error");
  }

  if (email) {
    await sendPurchaseEmail({ to: email, order: result.order });
  }

  revalidatePath("/mypage");
  redirect("/mypage?order=confirmed");
}
