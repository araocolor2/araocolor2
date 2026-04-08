import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { getUnreadCount } from "../lib/notifications";

export async function NotificationBell() {
  const user = await currentUser();
  if (!user) return null;

  const count = await getUnreadCount(user.id);

  return (
    <Link href="/notifications" className="bell-link" aria-label={`알림 ${count > 0 ? count + "개" : "없음"}`}>
      <span className="bell-icon">🔔</span>
      {count > 0 ? (
        <span className="bell-badge">{count > 99 ? "99+" : count}</span>
      ) : null}
    </Link>
  );
}
