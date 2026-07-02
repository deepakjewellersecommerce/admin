
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../common/loading-screen";
import Product from "./product";
import { useGetProducts, useGetProductVariants } from "@/lib/react-query/product-query";
import { Input } from "../ui/input";
import { ProductColumns } from "./column";
import { useCategoryDistribution, useStockTurnover } from "@/lib/react-query/dashboard-analytics-query";
import { useGetAllMaterials, useGetAllGenders, useGetAllItems, useGetAllCategories, useGetAllSubcategories } from "@/lib/react-query/category-hierarchy-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Package, BarChart3, ChevronRight, X, Filter, Plus, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { Button } from "../ui/button";
import { flexRender, getCoreRowModel, useReactTable, PaginationState } from "@tanstack/react-table";
import ErrorBoundary from "../ui/error-boundary";

type TableFilter = {
  date: string;
  pageIndex: number;
  pageSize: number;
  search: string;
  categoryId?: string;
  subcategoryId?: string;
};

const formatNumber = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ---------------------------------------------------------------------------
// Expanded variant sub-table for one product
// ---------------------------------------------------------------------------

function ProductVariantsRow({ productId, colSpan }: { productId: string; colSpan: number }) {
  const { data, isLoading } = useGetProductVariants(productId);

  const variants = useMemo(() => {
    const raw =
      data?.data?.data?.variants ??
      data?.data?.variants ??
      data?.variants ??
      [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  return (
    <TableRow className="bg-violet-50/40 hover:bg-violet-50/60">
      <TableCell colSpan={colSpan} className="px-6 py-3">
        {isLoading && (
          <p className="text-sm text-muted-foreground py-2">Loading variants...</p>
        )}
        {!isLoading && variants.length === 0 && (
          <p className="text-sm text-muted-foreground py-2 italic">No variants for this product.</p>
        )}
        {!isLoading && variants.length > 0 && (
          <div className="rounded-md border border-violet-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-violet-100/60 hover:bg-violet-100/60">
                  <TableHead className="h-8 px-3 text-xs text-violet-700 w-12">Img</TableHead>
                  <TableHead className="h-8 px-3 text-xs text-violet-700">Color</TableHead>
                  <TableHead className="h-8 px-3 text-xs text-violet-700">Size</TableHead>
                  <TableHead className="h-8 px-3 text-xs text-violet-700">Gross Wt</TableHead>
                  <TableHead className="h-8 px-3 text-xs text-violet-700">Net Wt</TableHead>
                  <TableHead className="h-8 px-3 text-xs text-violet-700">Stock</TableHead>
                  <TableHead className="h-8 px-3 text-xs text-violet-700">Price</TableHead>
                  <TableHead className="h-8 px-3 text-xs text-violet-700">Sale Price</TableHead>
                  <TableHead className="h-8 px-3 text-xs text-violet-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((v: any) => {
                  const imgSrc = Array.isArray(v.imageUrls) && v.imageUrls.length > 0
                    ? (typeof v.imageUrls[0] === "object" ? v.imageUrls[0]?.url ?? "" : v.imageUrls[0])
                    : null;
                  const colorName = typeof v.color === "object" ? v.color?.color_name : v.color;
                  const colorHex = typeof v.color === "object" ? v.color?.hexcode : null;

                  return (
                    <TableRow key={v._id} className="border-violet-100 hover:bg-violet-50/40">
                      <TableCell className="px-3 py-2">
                        {imgSrc ? (
                          <img src={imgSrc} alt="" className="h-9 w-9 rounded object-cover border border-violet-100" />
                        ) : (
                          <div className="h-9 w-9 rounded border border-violet-100 bg-white flex items-center justify-center">
                            <ImageIcon size={14} className="text-gray-300" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm">
                        {colorName ? (
                          <div className="flex items-center gap-1.5">
                            {colorHex && (
                              <span className="h-3 w-3 rounded-full border inline-block" style={{ backgroundColor: colorHex }} />
                            )}
                            {colorName}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm">{v.size || "—"}</TableCell>
                      <TableCell className="px-3 py-2 text-sm tabular-nums">
                        {v.grossWeight != null ? `${v.grossWeight}g` : "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm tabular-nums">
                        {v.netWeight != null ? `${v.netWeight}g` : "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm tabular-nums">
                        <span className={v.stock === 0 ? "text-red-500 font-medium" : ""}>
                          {v.stock ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm tabular-nums">
                        {v.price != null ? fmt(v.price) : "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm tabular-nums">
                        {v.salePrice != null && v.salePrice > 0 ? fmt(v.salePrice) : "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={
                            v.isActive
                              ? "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-50 shadow-none text-xs"
                              : "text-red-700 border-red-200 bg-red-50 hover:bg-red-50 shadow-none text-xs"
                          }
                        >
                          {v.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Main product list
// ---------------------------------------------------------------------------

const ProductList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const [products, setproducts] = useState<Product[]>([]);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TableFilter>({
    pageIndex: 0,
    pageSize: 10,
    date: "",
    search: "",
  });

  // Hierarchy selection state
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedGenderId, setSelectedGenderId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");

  // Fetch hierarchy data
  const { data: materialsRaw } = useGetAllMaterials();
  const { data: gendersRaw } = useGetAllGenders();
  const { data: itemsRaw } = useGetAllItems();
  const { data: categoriesRaw } = useGetAllCategories({
    ...(selectedMaterialId ? { materialId: selectedMaterialId } : {}),
    ...(selectedGenderId ? { genderId: selectedGenderId } : {}),
    ...(selectedItemId ? { itemId: selectedItemId } : {}),
  });
  const { data: subcategoriesRaw } = useGetAllSubcategories(
    selectedCategoryId ? { categoryId: selectedCategoryId } : {}
  );

  const materials = useMemo(() => {
    const d = materialsRaw?.data?.materials ?? materialsRaw?.materials;
    return Array.isArray(d) ? d : [];
  }, [materialsRaw]);

  const genders = useMemo(() => {
    const d = gendersRaw?.data?.genders ?? gendersRaw?.genders;
    return Array.isArray(d) ? d : [];
  }, [gendersRaw]);

  const items = useMemo(() => {
    const d = itemsRaw?.data?.items ?? itemsRaw?.items;
    return Array.isArray(d) ? d : [];
  }, [itemsRaw]);

  const categories = useMemo(() => {
    const d = categoriesRaw?.data?.categories ?? categoriesRaw?.categories;
    return Array.isArray(d) ? d : [];
  }, [categoriesRaw]);

  const subcategories = useMemo(() => {
    const d = subcategoriesRaw?.data?.subcategories ?? subcategoriesRaw?.subcategories;
    return Array.isArray(d) ? d : [];
  }, [subcategoriesRaw]);

  const distParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (selectedMaterialId) params.materialId = selectedMaterialId;
    if (selectedGenderId) params.genderId = selectedGenderId;
    if (selectedItemId) params.itemId = selectedItemId;
    if (selectedCategoryId) params.categoryId = selectedCategoryId;
    if (selectedCategoryId) params.groupBy = "category";
    else if (selectedItemId) params.groupBy = "category";
    else if (selectedGenderId) params.groupBy = "item";
    else if (selectedMaterialId) params.groupBy = "gender";
    else params.groupBy = "material";
    return params;
  }, [selectedMaterialId, selectedGenderId, selectedItemId, selectedCategoryId]);

  const turnoverParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (selectedMaterialId) params.materialId = selectedMaterialId;
    if (selectedGenderId) params.genderId = selectedGenderId;
    if (selectedItemId) params.itemId = selectedItemId;
    if (selectedCategoryId) params.categoryId = selectedCategoryId;
    return params;
  }, [selectedMaterialId, selectedGenderId, selectedItemId, selectedCategoryId]);

  const { data: categoryDistRaw } = useCategoryDistribution(distParams);
  const { data: stockTurnoverRaw } = useStockTurnover(turnoverParams);

  const categoryDist = Array.isArray(categoryDistRaw?.data ?? categoryDistRaw)
    ? categoryDistRaw?.data ?? categoryDistRaw
    : [];
  const stockTurnover = Array.isArray(stockTurnoverRaw?.data ?? stockTurnoverRaw)
    ? stockTurnoverRaw?.data ?? stockTurnoverRaw
    : [];

  const { isLoading, data, isSuccess, isError } = useGetProducts(filter);

  useEffect(() => {
    if (isSuccess) {
      setproducts(Array.from(data.data.data.products));
    }
  }, [isSuccess, data]);

  useEffect(() => {
    setFilter((prev) => ({ ...prev, search, pageIndex: 0 }));
  }, [search]);

  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      pageIndex: 0,
      subcategoryId: selectedSubcategoryId || undefined,
      categoryId: !selectedSubcategoryId && selectedCategoryId ? selectedCategoryId : undefined,
    }));
  }, [selectedSubcategoryId, selectedCategoryId]);

  const handleMaterialChange = (id: string) => {
    setSelectedMaterialId(id);
    setSelectedGenderId("");
    setSelectedItemId("");
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
  };

  const handleGenderChange = (id: string) => {
    setSelectedGenderId(id);
    setSelectedItemId("");
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
  };

  const handleItemChange = (id: string) => {
    setSelectedItemId(id);
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
  };

  const handleCategoryChange = (id: string) => {
    setSelectedCategoryId(id);
    setSelectedSubcategoryId("");
  };

  const clearAllFilters = () => {
    setSelectedMaterialId("");
    setSelectedGenderId("");
    setSelectedItemId("");
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
  };

  const hasAnyFilter = selectedMaterialId || selectedGenderId || selectedItemId || selectedCategoryId;

  const breadcrumb = useMemo(() => {
    const parts: string[] = [];
    if (selectedMaterialId) {
      const m = materials.find((x: any) => x._id === selectedMaterialId);
      if (m) parts.push((m as any).displayName || (m as any).name);
    }
    if (selectedGenderId) {
      const g = genders.find((x: any) => x._id === selectedGenderId);
      if (g) parts.push((g as any).name);
    }
    if (selectedItemId) {
      const i = items.find((x: any) => x._id === selectedItemId);
      if (i) parts.push((i as any).name);
    }
    if (selectedCategoryId) {
      const c = categories.find((x: any) => x._id === selectedCategoryId);
      if (c) parts.push((c as any).name);
    }
    if (selectedSubcategoryId) {
      const s = subcategories.find((x: any) => x._id === selectedSubcategoryId);
      if (s) parts.push((s as any).name);
    }
    return parts;
  }, [selectedMaterialId, selectedGenderId, selectedItemId, selectedCategoryId, selectedSubcategoryId, materials, genders, items, categories, subcategories]);

  const totals = useMemo(() => {
    return (categoryDist || []).reduce(
      (acc: any, c: any) => ({
        total: acc.total + (c.total || 0),
        active: acc.active + (c.active || 0),
        inactive: acc.inactive + (c.inactive || 0),
        outOfStock: acc.outOfStock + (c.outOfStock || 0),
      }),
      { total: 0, active: 0, inactive: 0, outOfStock: 0 }
    );
  }, [categoryDist]);

  // ---------------------------------------------------------------------------
  // Inline table with expandable rows
  // ---------------------------------------------------------------------------

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: filter.pageIndex,
    pageSize: 10,
  });

  // Keep pagination in sync when filter changes externally (e.g. search reset)
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: filter.pageIndex }));
  }, [filter.pageIndex]);

  const table = useReactTable({
    data: products,
    columns: ProductColumns,
    manualPagination: true,
    state: { pagination },
    pageCount: data?.data?.data?.totalPage ?? 1,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      setPagination(next);
      setFilter((prev) => ({ ...prev, pageIndex: next.pageIndex }));
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const colCount = ProductColumns.length;

  return (
    <section className="">
      <h2 className="mb-2 text-3xl tracking-wide">Products List</h2>

      {/* Hierarchy Filter */}
      <Card className="mt-4 mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Category Hierarchy
            </CardTitle>
            {hasAnyFilter && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          {breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1 flex-wrap">
              <span className="text-foreground font-medium">Path:</span>
              {breadcrumb.map((part, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  <span className="text-foreground">{part}</span>
                </span>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Material</label>
              <select
                value={selectedMaterialId}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="w-full h-9 rounded-md border px-3 text-sm bg-background"
              >
                <option value="">All Materials</option>
                {materials.map((m: any) => (
                  <option key={m._id} value={m._id}>{m.displayName || m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Gender</label>
              <select
                value={selectedGenderId}
                onChange={(e) => handleGenderChange(e.target.value)}
                className="w-full h-9 rounded-md border px-3 text-sm bg-background"
              >
                <option value="">All Genders</option>
                {genders.map((g: any) => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Item Type</label>
              <select
                value={selectedItemId}
                onChange={(e) => handleItemChange(e.target.value)}
                className="w-full h-9 rounded-md border px-3 text-sm bg-background"
              >
                <option value="">All Items</option>
                {items.map((i: any) => (
                  <option key={i._id} value={i._id}>{i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={!selectedMaterialId || !selectedGenderId || !selectedItemId}
                className="w-full h-9 rounded-md border px-3 text-sm bg-background disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{(!selectedMaterialId || !selectedGenderId || !selectedItemId) ? "Select above first" : "All Categories"}</option>
                {categories.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subcategory</label>
              <select
                value={selectedSubcategoryId}
                onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                disabled={!selectedCategoryId}
                className="w-full h-9 rounded-md border px-3 text-sm bg-background disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{!selectedCategoryId ? "Select category first" : "All Subcategories"}</option>
                {subcategories.map((s: any) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution + Stock Turnover */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="border rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{formatNumber(totals.total)}</div>
                <Badge variant="default" className="mt-1">Total</Badge>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{formatNumber(totals.active)}</div>
                <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{formatNumber(totals.inactive)}</div>
                <Badge className="mt-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Inactive</Badge>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{formatNumber(totals.outOfStock)}</div>
                <Badge className="mt-1 bg-red-100 text-red-800 hover:bg-red-100">Out of Stock</Badge>
              </div>
            </div>
            {(categoryDist || []).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">Inactive</TableHead>
                    <TableHead className="text-right">Out of Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(categoryDist || []).map((c: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{formatNumber(c.total)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatNumber(c.active)}</TableCell>
                      <TableCell className="text-right text-yellow-600">{formatNumber(c.inactive)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatNumber(c.outOfStock)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No category data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Stock Turnover by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Turnover Rate</TableHead>
                  <TableHead className="text-right">Avg Days</TableHead>
                  <TableHead className="text-right">Total Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stockTurnover || []).map((s: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{s.category}</TableCell>
                    <TableCell className="text-right">{s.turnoverRate}x</TableCell>
                    <TableCell className="text-right">{s.avgDaysToSell}</TableCell>
                    <TableCell className="text-right">{formatNumber(s.totalSold)}</TableCell>
                  </TableRow>
                ))}
                {(!stockTurnover || stockTurnover.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Products table with inline variant expansion */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg">All Products</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                value={search}
                placeholder="Search products..."
                onChange={(e) => setSearch(e.target.value)}
                className="w-72 h-9"
              />
              <Button
                className="flex items-center gap-2"
                onClick={() => navigate("/dashboard/products/add")}
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isError && (
            <p className="py-8 text-center text-sm text-destructive">
              Failed to load products. Please refresh the page.
            </p>
          )}
          {isLoading && <LoadingScreen />}
          {isSuccess && (
            <div className="rounded-md">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-b border-border/60 hover:bg-transparent">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="h-9 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap bg-muted/30"
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => {
                      const productId = (row.original as Product)._id ?? "";
                      const isExpanded = expandedProductId === productId;

                      return (
                        <>
                          <TableRow
                            key={row.id}
                            className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                            data-state={row.getIsSelected() ? "selected" : undefined}
                          >
                            {row.getVisibleCells().map((cell) => {
                              const isNameCell = cell.column.id === "productTitle";
                              return (
                                <TableCell
                                  key={cell.id}
                                  className={`px-4 py-3 ${isNameCell ? "cursor-pointer select-none" : ""}`}
                                  onClick={
                                    isNameCell
                                      ? () => setExpandedProductId(isExpanded ? null : productId)
                                      : undefined
                                  }
                                >
                                  <ErrorBoundary>
                                    {isNameCell ? (
                                      <div className="flex items-center gap-2">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        {isExpanded
                                          ? <ChevronUp size={14} className="text-violet-500 shrink-0" />
                                          : <ChevronDown size={14} className="text-muted-foreground/50 shrink-0" />
                                        }
                                      </div>
                                    ) : (
                                      flexRender(cell.column.columnDef.cell, cell.getContext())
                                    )}
                                  </ErrorBoundary>
                                </TableCell>
                              );
                            })}
                          </TableRow>

                          {isExpanded && (
                            <ProductVariantsRow
                              key={`variants-${productId}`}
                              productId={productId}
                              colSpan={colCount}
                            />
                          )}
                        </>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={colCount} className="h-32 text-center text-muted-foreground">
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                <p className="text-sm text-muted-foreground tabular-nums">
                  Page {pagination.pageIndex + 1} of {data?.data?.data?.totalPage || 1}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={!table.getCanPreviousPage()}
                    onClick={table.previousPage}
                  >
                    <ChevronRight size={14} className="rotate-180" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={!table.getCanNextPage()}
                    onClick={table.nextPage}
                  >
                    Next
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default ProductList;
