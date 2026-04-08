import { currentUser } from "@clerk/nextjs/server";
import { getUnreadCount } from "../lib/notifications";
import { AuthNav } from "./auth-nav";

export async function AuthNavServer() {
  const user = await currentUser();
  const unreadCount = user ? await getUnreadCount(user.id) : 0;
  return <AuthNav unreadCount={unreadCount} />;
}
