import { ColumnDef } from "@tanstack/react-table";
import Product from "./product";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Pencil, Trash2, DollarSign, Info, Eye } from "lucide-react";
import AlertConfirm from "../ui/alert-confirm";
import { useDeleteProduct } from "@/lib/react-query/product-query";
import { Badge } from "../ui/badge";
import { Tooltip } from "../ui/tooltip";
import { useNavigate } from "react-router-dom";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

// ── Price Breakdown Tooltip ───────────────────────────────────────────────────

function PriceBreakdownTooltip({ product }: { product: Product }) {
  const bd = product.priceBreakdown;
  const mode = product.pricingMode;

  // Nothing to show for static price without breakdown
  const hasBreakdown = bd && (bd.components?.length || bd.metalCost);

  const content = (
    <div className="text-xs w-72">
      {/* ── Header ── */}
      <div className="px-3 py-2 border-b bg-violet-50 rounded-t-lg flex items-center justify-between">
        <span className="font-semibold text-violet-700 text-sm">Price Breakdown</span>
        <Badge
          variant="outline"
          className="text-[10px] font-normal border-violet-200 text-violet-600"
        >
          {mode === "STATIC_PRICE"
            ? "Fixed"
            : mode === "CUSTOM_DYNAMIC"
            ? "Custom"
            : "Dynamic"}
        </Badge>
      </div>

      <div className="px-3 pt-3 pb-1 space-y-3">
        {/* ── ADMIN VIEW ── */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Admin View (Cost Breakdown)
          </p>

          {!hasBreakdown && mode === "STATIC_PRICE" ? (
            <div className="flex justify-between text-foreground">
              <span>Fixed Price</span>
              <span className="font-semibold">{fmt(product.staticPrice ?? 0)}</span>
            </div>
          ) : hasBreakdown ? (
            <div className="space-y-1">
              {/* Metal */}
              {bd!.metalCost != null && bd!.metalCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {bd!.metalType ?? "Metal"} cost
                    {bd!.metalRate ? (
                      <span className="ml-1 text-[10px] text-muted-foreground/70">
                        @ ₹{bd!.metalRate.toLocaleString("en-IN")}/g
                      </span>
                    ) : null}
                  </span>
                  <span>{fmt(bd!.metalCost!)}</span>
                </div>
              )}

              {/* Components (admin-internal) */}
              {bd!.components
                ?.filter((c) => c.isVisible !== false && c.value > 0)
                .map((c, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {c.componentName}
                      {c.isFrozen && (
                        <span className="text-[9px] text-amber-500 font-medium">FROZEN</span>
                      )}
                    </span>
                    <span>{fmt(c.value)}</span>
                  </div>
                ))}

              {/* Gemstones */}
              {product.gemstones?.filter((g) => (g.totalCost ?? 0) > 0).map((g, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {g.customName || g.name}
                    <span className="ml-1 text-[10px] text-muted-foreground/70">
                      {g.weight}ct
                    </span>
                  </span>
                  <span>{fmt(g.totalCost ?? g.weight * g.pricePerCarat)}</span>
                </div>
              ))}

              {/* Gemstone cost aggregate (if no individual breakdown) */}
              {(!product.gemstones?.length && bd!.gemstoneCost != null && bd!.gemstoneCost > 0) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gemstones</span>
                  <span>{fmt(bd!.gemstoneCost!)}</span>
                </div>
              )}

              {/* Subtotal */}
              {bd!.subtotal != null && (
                <>
                  <div className="border-t border-dashed my-1" />
                  <div className="flex justify-between text-foreground font-medium">
                    <span>Subtotal</span>
                    <span>{fmt(bd!.subtotal)}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No breakdown available</p>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="border-t" />

        {/* ── USER VIEW ── */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            User View (What customer sees)
          </p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Price</span>
              <span>{fmt(bd?.subtotal ?? product.calculatedPrice ?? product.staticPrice ?? 0)}</span>
            </div>

            {product.gst != null && product.gst > 0 && (() => {
              const base = bd?.subtotal ?? product.calculatedPrice ?? product.staticPrice ?? 0;
              const gstAmt = Math.round(base * product.gst! / 100);
              return (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST ({product.gst}%)</span>
                  <span>{fmt(gstAmt)}</span>
                </div>
              );
            })()}

            <div className="border-t border-dashed my-1" />
            <div className="flex justify-between font-semibold text-violet-700">
              <span>Final Price</span>
              <span>
                {fmt(
                  product.salePrice ??
                  product.calculatedPrice ??
                  product.staticPrice ??
                  0
                )}
              </span>
            </div>

            {product.salePrice != null &&
              product.calculatedPrice != null &&
              product.salePrice < product.calculatedPrice && (
                <div className="flex justify-between text-emerald-600 text-[11px]">
                  <span>Discount</span>
                  <span>-{fmt(product.calculatedPrice - product.salePrice)}</span>
                </div>
              )}
          </div>
        </div>

        {/* ── Last calculated ── */}
        {bd?.lastCalculated && (
          <p className="text-[10px] text-muted-foreground/60 pb-1 text-right">
            Calculated {new Date(bd.lastCalculated).toLocaleDateString("en-IN")}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Tooltip content={content} size="lg" side="top">
      <div className="text-right tabular-nums cursor-default group inline-flex flex-col items-end">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">
            {fmt(
              product.salePrice ??
              product.calculatedPrice ??
              product.regularPrice ??
              product.staticPrice ??
              0
            )}
          </span>
          <Info
            size={12}
            className="text-muted-foreground/40 group-hover:text-violet-400 transition-colors shrink-0"
          />
        </div>
        {product.salePrice != null &&
          (product.calculatedPrice ?? product.regularPrice) != null &&
          product.salePrice < (product.calculatedPrice ?? product.regularPrice)! && (
            <span className="text-xs text-muted-foreground line-through">
              {fmt(product.calculatedPrice ?? product.regularPrice!)}
            </span>
          )}
      </div>
    </Tooltip>
  );
}

// ── Columns ───────────────────────────────────────────────────────────────────

export const ProductColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "productImageUrl",
    header: "",
    size: 64,
    cell: ({ row }) => {
      const src = Array.isArray(row.original.productImageUrl)
        ? row.original.productImageUrl[0]
        : row.original.productImageUrl || "/images/placeholder.jpg";
      return (
        <img
          src={src}
          alt={row.original.productTitle}
          className="w-12 h-12 rounded-md object-cover bg-gray-100"
        />
      );
    },
  },
  {
    accessorKey: "productTitle",
    header: "Product",
    cell: ({ row }) => (
      <div className="min-w-[180px]">
        <div className="font-medium text-sm leading-tight">{row.original.productTitle}</div>
        <div className="text-xs text-muted-foreground mt-0.5 font-mono">
          SKU #{row.original.skuNo}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "categoryId",
    header: "Category",
    cell: ({ row }) => {
      const categoryId: any = row.original.categoryId;
      const categoryName = typeof categoryId === "object" ? categoryId?.name : "—";
      return (
        <span className="text-sm text-muted-foreground">{categoryName ?? "—"}</span>
      );
    },
  },
  {
    accessorKey: "regularPrice",
    header: "Price",
    cell: ({ row }) => <PriceBreakdownTooltip product={row.original} />,
  },
  {
    accessorKey: "gst",
    header: "GST",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {row.original.gst != null ? `${row.original.gst}%` : "—"}
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        className={
          row.original.isActive
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 shadow-none"
            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50 shadow-none"
        }
        variant="outline"
      >
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    accessorKey: "isFeatured",
    header: "Featured",
    cell: ({ row }) =>
      row.original.isFeatured ? (
        <Badge
          className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 shadow-none"
          variant="outline"
        >
          Featured
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    id: "actions",
    header: "",
    size: 120,
    cell: ({ row }) => <ActionButtons id={row.original._id} />,
  },
];

// ── Action buttons ────────────────────────────────────────────────────────────

function ActionButtons({ id }: { id?: string }) {
  const deleteMut = useDeleteProduct();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => navigate(`/dashboard/products/${id}/pricing`)}
        title="Pricing"
      >
        <DollarSign size={15} />
      </Button>
      <Link to={`/dashboard/products/view/${id}`}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="View"
        >
          <Eye size={15} />
        </Button>
      </Link>
      <Link to={`/dashboard/products/edit/${id}`}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Edit"
        >
          <Pencil size={15} />
        </Button>
      </Link>
      <AlertConfirm
        actionMessage="Delete"
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={() => {
          if (id) deleteMut.mutate(id);
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-red-600"
          title="Delete"
        >
          <Trash2 size={15} />
        </Button>
      </AlertConfirm>
    </div>
  );
}
