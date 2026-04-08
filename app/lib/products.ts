export type Product = {
  slug: string;
  name: string;
  priceAmount: number;
  priceLabel: string;
  description: string;
  label: string;
  details: string[];
  downloadUrl?: string | null;
};

export const fallbackProducts: Product[] = [
  {
    slug: "basic-pack",
    name: "제주컬러 기본 팩",
    priceAmount: 110000,
    priceLabel: "110,000원",
    description: "제주 색상 기준표와 기본 팔레트 자료.",
    label: "BASIC",
    details: ["기본 색상 팔레트", "브랜드 작업용 색상 기준", "다운로드형 디지털 자료"]
  },
  {
    slug: "image-pack",
    name: "제주컬러 이미지 팩",
    priceAmount: 110000,
    priceLabel: "110,000원",
    description: "상세 페이지와 게시글에 쓰기 좋은 이미지 자료.",
    label: "IMAGE",
    details: ["상품 상세 이미지 참고", "게시글용 이미지 구성", "웹 운영용 시각 자료"]
  },
  {
    slug: "season-pack",
    name: "제주컬러 계절 팩",
    priceAmount: 110000,
    priceLabel: "110,000원",
    description: "봄, 여름, 가을, 겨울 감성별 색상 자료.",
    label: "SEASON",
    details: ["계절별 색상 조합", "캠페인용 팔레트", "시즌 작업 참고 자료"]
  },
  {
    slug: "brand-pack",
    name: "제주컬러 브랜드 팩",
    priceAmount: 110000,
    priceLabel: "110,000원",
    description: "브랜드 작업에 바로 쓰기 좋은 조합 자료.",
    label: "BRAND",
    details: ["브랜드 색상 조합", "로고/상세 페이지 참고", "실무 적용 예시"]
  },
  {
    slug: "detail-pack",
    name: "제주컬러 상세 팩",
    priceAmount: 110000,
    priceLabel: "110,000원",
    description: "상품 상세 화면 구성을 위한 참고 자료.",
    label: "DETAIL",
    details: ["상세 화면 구성 참고", "상품 소개 문구 구조", "구매 전 미리보기 기준"]
  },
  {
    slug: "all-pack",
    name: "제주컬러 전체 팩",
    priceAmount: 110000,
    priceLabel: "110,000원",
    description: "전체 자료를 한 번에 확인하는 구성.",
    label: "ALL",
    details: ["전체 상품 통합 구성", "브랜드/이미지/계절 자료 포함", "구매 내역에서 확인"]
  }
];

export function formatPrice(priceAmount: number) {
  return `${priceAmount.toLocaleString("ko-KR")}원`;
}

export function normalizeProduct(row: Record<string, unknown>): Product {
  const priceAmount = Number(row.price_amount ?? 110000);

  return {
    slug: String(row.slug),
    name: String(row.name),
    priceAmount,
    priceLabel: formatPrice(priceAmount),
    description: String(row.description ?? ""),
    label: String(row.label ?? "PACK"),
    details: Array.isArray(row.details)
      ? row.details.map(String)
      : ["다운로드형 디지털 자료", "구매 후 마이페이지에서 확인"],
    downloadUrl: typeof row.download_url === "string" ? row.download_url : null
  };
}

export function getFallbackProduct(slug: string) {
  return fallbackProducts.find((product) => product.slug === slug) ?? null;
}
