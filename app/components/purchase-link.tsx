export function PurchaseLink({
  productSlug,
  className = "pill-link",
  label = "구매하기 >"
}: {
  productSlug: string;
  className?: string;
  label?: string;
}) {
  return (
    <a href={`/checkout?product=${productSlug}`} className={className}>
      {label}
    </a>
  );
}
