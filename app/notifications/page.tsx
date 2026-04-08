import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { AuthNavServer } from "../components/auth-nav-server";
import { SiteFooter } from "../components/site-footer";
import { getNotifications } from "../lib/notifications";
import { markAllReadAction, markOneReadAction } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  comment: "새 댓글",
  like: "좋아요",
  reply: "새 답글"
};

export default async function NotificationsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { notifications } = await getNotifications(user.id);

  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand">제주컬러</Link>
        <AuthNavServer />
      </header>

      <section className="section narrow">
        <div className="notifications-header">
          <div>
            <p className="eyebrow">NOTIFICATIONS</p>
            <h1>알림</h1>
          </div>
          {notifications.some((n) => !n.isRead) ? (
            <form action={markAllReadAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button className="button button-secondary" style={{ fontSize: "14px", minHeight: "36px" }}>
                전체 읽음
              </button>
            </form>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <p>알림이 없습니다.</p>
          </div>
        ) : (
          <ul className="notification-list">
            {notifications.map((n) => (
              <li key={n.id} className={`notification-item${n.isRead ? "" : " unread"}`}>
                <form action={markOneReadAction}>
                  <input type="hidden" name="notificationId" value={n.id} />
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="postId" value={n.postId ?? ""} />
                  <button type="submit" className="notification-btn">
                    <span className="notification-type">{TYPE_LABEL[n.type] ?? n.type}</span>
                    <span className="notification-text">
                      {n.senderUsername ?? "누군가"}님이
                      {n.type === "comment" ? " 내 글에 댓글을 남겼습니다" : ""}
                      {n.type === "reply" ? " 내 글에 답글을 남겼습니다" : ""}
                      {n.type === "like" ? " 내 글을 좋아합니다" : ""}
                    </span>
                    <span className="notification-date">
                      {new Date(n.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    {!n.isRead ? <span className="unread-dot" /> : null}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
