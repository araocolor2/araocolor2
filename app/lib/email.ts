import { Resend } from "resend";
import type { Order } from "./orders";

export async function sendPurchaseEmail(input: {
  to: string;
  order: Order;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { ok: false, message: "RESEND_API_KEY가 없어 메일 발송을 건너뜁니다." };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? "제주컬러 <onboarding@resend.dev>";
  const downloadText = input.order.downloadUrl
    ? `다운로드 링크: ${input.order.downloadUrl}`
    : "다운로드 링크는 마이페이지에서 확인하세요.";

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: "[제주컬러] 구매가 완료되었습니다",
    text: [
      "구매가 완료되었습니다.",
      "",
      `상품명: ${input.order.productName}`,
      `금액: ${input.order.amount.toLocaleString("ko-KR")}원`,
      downloadText
    ].join("\n")
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "구매 완료 메일 발송 완료" };
}
