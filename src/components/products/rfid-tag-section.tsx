import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  useGenerateRfidTags,
  useGetRfidTags,
  useGetRfidSummary,
  useDownloadRfidCsv,
  useUpdateRfidTagStatus,
} from "@/lib/react-query/rfid-tag-query";
import type { RfidTag } from "@/lib/axios/rfid-tag-API";
import { DataTable } from "@/components/table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Radio,
  Download,
  Plus,
  Loader2,
  Search,
  Ban,
  RotateCcw,
  AlertTriangle,
  Check,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

interface VariantBreakdown {
  variantId: string;
  size: string;
  color: string | null;
  stock: number;
  rfidCount: number;
  gap: number; // stock - rfidCount (positive = tags missing)
}

interface Summary {
  total: number;
  active: number;
  sold: number;
  returned: number;
  deactivated: number;
  unassignedTags: number;
  variants: VariantBreakdown[];
}

// ── Constants ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  ACTIVE: "default",
  SOLD: "secondary",
  RETURNED: "outline",
  DEACTIVATED: "destructive",
};

const rfidColumns: ColumnDef<RfidTag>[] = [
  {
    header: "RFID Code",
    accessorKey: "rfidCode",
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium">
        {row.original.rfidCode}
      </span>
    ),
  },
  {
    header: "Serial",
    accessorKey: "serialNumber",
    cell: ({ row }) => (
      <span className="text-muted-foreground">#{row.original.serialNumber}</span>
    ),
  },
  {
    header: "Variant",
    accessorKey: "variantSize",
    cell: ({ row }) => row.original.variantSize || "—",
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => (
      <Badge variant={STATUS_COLORS[row.original.status] || "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    header: "Created",
    accessorKey: "createdAt",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  },
];

// ── Component ──────────────────────────────────────────────────────

interface RfidTagSectionProps {
  productId: string;
}

const RfidTagSection = ({ productId }: RfidTagSectionProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const queryParams = {
    page,
    limit: 50,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };

  const { data: summaryRes } = useGetRfidSummary(productId);
  const { data: tagsRes, isLoading: isLoadingTags } = useGetRfidTags(
    productId,
    queryParams
  );
  const generateMutation = useGenerateRfidTags();
  const downloadMutation = useDownloadRfidCsv();
  const updateStatusMutation = useUpdateRfidTagStatus();

  const summary: Summary = summaryRes?.data?.data ?? summaryRes?.data ?? {
    total: 0,
    active: 0,
    sold: 0,
    returned: 0,
    deactivated: 0,
    unassignedTags: 0,
    variants: [],
  };
  const variants: VariantBreakdown[] = summary.variants || [];
  const tagsData = tagsRes?.data?.data ?? tagsRes?.data ?? { tags: [], pagination: {} };
  const tags: RfidTag[] = tagsData.tags || [];
  const pagination = tagsData.pagination || {};

  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const totalGap = variants.reduce((s, v) => s + Math.max(0, v.gap), 0);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleGenerateForVariant = async (variantId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      const res = await generateMutation.mutateAsync({
        productId,
        variantId,
        quantity,
      });
      const count = res?.data?.data?.tags?.length || quantity;
      const range = res?.data?.data?.range;
      toast({
        title: "RFID Tags Generated",
        description: `${count} tags created${range ? ` (${range.from} → ${range.to})` : ""}.`,
      });
    } catch (err: any) {
      toast({
        title: "Generation Failed",
        description: err?.response?.data?.error?.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAllMissing = async () => {
    const variantsWithGap = variants.filter((v) => v.gap > 0);
    if (!variantsWithGap.length) return;

    for (const v of variantsWithGap) {
      try {
        await generateMutation.mutateAsync({
          productId,
          variantId: v.variantId,
          quantity: v.gap,
        });
      } catch {
        // continue with remaining variants
      }
    }
    toast({
      title: "RFID Tags Generated",
      description: `Generated tags for ${variantsWithGap.length} variant(s).`,
    });
  };

  const handleDownload = async () => {
    try {
      const res = await downloadMutation.mutateAsync({
        productId,
        params: {
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rfid-tags-${productId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "CSV Downloaded" });
    } catch {
      toast({
        title: "Download Failed",
        description: "No tags found or something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (tagId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ tagId, status: "DEACTIVATED" });
      toast({ title: "Tag Deactivated" });
    } catch {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const handleReactivate = async (tagId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ tagId, status: "ACTIVE" });
      toast({ title: "Tag Reactivated" });
    } catch {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  // Action column
  const columnsWithActions: ColumnDef<RfidTag>[] = [
    ...rfidColumns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const tag = row.original;
        if (tag.status === "ACTIVE") {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeactivate(tag._id)}
              disabled={updateStatusMutation.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Ban className="h-3.5 w-3.5 mr-1" />
              Deactivate
            </Button>
          );
        }
        if (tag.status === "DEACTIVATED") {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReactivate(tag._id)}
              disabled={updateStatusMutation.isPending}
              className="text-green-600 hover:text-green-700"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reactivate
            </Button>
          );
        }
        return <span className="text-xs text-muted-foreground">{tag.status}</span>;
      },
    },
  ];

  // ── Render ───────────────────────────────────────────────────────

  return (
    <section className="mt-8">
      <h2 className="mb-2 text-3xl tracking-wide flex items-center gap-2">
        <Radio className="h-7 w-7" />
        RFID Tags
      </h2>

      <div className="mt-4 rounded-lg border bg-white px-4 py-6">
        {/* ── Overall Summary ─────────────────────────────────── */}
        {summary.total > 0 && (
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <Badge variant="outline" className="text-sm px-3 py-1">
              Total: {summary.total}
            </Badge>
            <Badge variant="default" className="text-sm px-3 py-1">
              Active: {summary.active}
            </Badge>
            {summary.sold > 0 && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Sold: {summary.sold}
              </Badge>
            )}
            {summary.returned > 0 && (
              <Badge variant="outline" className="text-sm px-3 py-1">
                Returned: {summary.returned}
              </Badge>
            )}
            {summary.deactivated > 0 && (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                Deactivated: {summary.deactivated}
              </Badge>
            )}
          </div>
        )}

        {/* ── Per-Variant Breakdown ───────────────────────────── */}
        {variants.length > 0 ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Variant RFID Coverage
              </h3>
              {totalGap > 0 && (
                <Button
                  size="sm"
                  onClick={handleGenerateAllMissing}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Generate All Missing ({totalGap} tags)
                </Button>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden mb-10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Variant</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Stock</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">RFID Tags</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <VariantRow
                      key={v.variantId}
                      variant={v}
                      onGenerate={handleGenerateForVariant}
                      isGenerating={generateMutation.isPending}
                    />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t font-medium">
                    <td className="px-4 py-2.5">Total</td>
                    <td className="text-center px-4 py-2.5">{totalStock}</td>
                    <td className="text-center px-4 py-2.5">{summary.active}</td>
                    <td className="text-center px-4 py-2.5">
                      {totalGap === 0 ? (
                        <span className="text-green-600 flex items-center justify-center gap-1">
                          <Check className="h-3.5 w-3.5" /> All covered
                        </span>
                      ) : (
                        <span className="text-amber-600">{totalGap} missing</span>
                      )}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No variants found. Add variants with stock first, then generate RFID tags.
          </p>
        )}

        {/* ── Search + Filter + Download ────────────────────── */}
        {summary.total > 0 && (
          <div className="flex items-center gap-3 my-5">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                placeholder="Search RFID code..."
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
              >
                {downloadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download All RFID Tags (CSV)
              </Button>
            </div>
          </div>
        )}

        {/* ── Tags Table ──────────────────────────────────────── */}
        {tags.length > 0 && (
          <>
            <DataTable columns={columnsWithActions} data={tags} />

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} tags)
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {isLoadingTags && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading RFID tags...
          </div>
        )}

        {!isLoadingTags && tags.length === 0 && summary.total > 0 && (
          <p className="text-center text-muted-foreground py-8">
            No tags match the current filter.
          </p>
        )}
      </div>
    </section>
  );
};

// ── Variant Row Sub-Component ──────────────────────────────────────

function VariantRow({
  variant,
  onGenerate,
  isGenerating,
}: {
  variant: VariantBreakdown;
  onGenerate: (variantId: string, qty: number) => void;
  isGenerating: boolean;
}) {
  const gap = Math.max(0, variant.gap);
  const isFullyCovered = gap === 0;
  const hasExcess = variant.gap < 0;

  return (
    <tr className="border-b last:border-b-0 hover:bg-gray-50/50">
      <td className="px-4 py-2.5">
        <span className="font-medium">Size {variant.size}</span>
        {variant.color && (
          <span className="text-muted-foreground ml-1.5">· {variant.color}</span>
        )}
      </td>
      <td className="text-center px-4 py-2.5 tabular-nums">{variant.stock}</td>
      <td className="text-center px-4 py-2.5 tabular-nums">{variant.rfidCount}</td>
      <td className="text-center px-4 py-2.5">
        {isFullyCovered && !hasExcess && (
          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
            <Check className="h-3.5 w-3.5" /> Covered
          </span>
        )}
        {hasExcess && (
          <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-medium">
            +{Math.abs(variant.gap)} extra
          </span>
        )}
        {gap > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
            <AlertTriangle className="h-3.5 w-3.5" /> {gap} missing
          </span>
        )}
      </td>
      <td className="text-right px-4 py-2.5">
        {gap > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onGenerate(variant.variantId, gap)}
            disabled={isGenerating}
            className="h-7 text-xs"
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Plus className="h-3 w-3 mr-1" />
            )}
            Generate {gap}
          </Button>
        )}
      </td>
    </tr>
  );
}

export default RfidTagSection;
