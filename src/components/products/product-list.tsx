
import { useEffect, useRef, useState, useMemo } from "react";
import LoadingScreen from "../common/loading-screen";
import DataTable from "../table/data-table-server";
import Product from "./product";
import { useGetProducts } from "@/lib/react-query/product-query";
import { Input } from "../ui/input";
import { ProductColumns } from "./column";
import { useCategoryDistribution, useStockTurnover } from "@/lib/react-query/dashboard-analytics-query";
import { useGetAllMaterials, useGetAllGenders, useGetAllItems, useGetAllCategories, useGetAllSubcategories } from "@/lib/react-query/category-hierarchy-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Package, BarChart3, ChevronRight, X, Filter } from "lucide-react";
import { Button } from "../ui/button";

type TableFilter = {
  date: string;
  pageIndex: number;
  pageSize: number;
  search: string;
};

const formatNumber = (n: number) => new Intl.NumberFormat('en-IN').format(n);

const ProductList = () => {
  const [search, setSearch] = useState<string>("");
  const searchInput = useRef<HTMLInputElement>();
  const [products, setproducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<TableFilter>({
    pageIndex: 2,
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
  const { data: subcategoriesRaw } = useGetAllSubcategories({
    ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
  });

  // Extract arrays from API responses
  // API shape: { status, data: { materials: [...] } } — hooks return the outer object
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

  // Determine the groupBy level and build params for category distribution
  const distParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (selectedMaterialId) params.materialId = selectedMaterialId;
    if (selectedGenderId) params.genderId = selectedGenderId;
    if (selectedItemId) params.itemId = selectedItemId;
    if (selectedCategoryId) params.categoryId = selectedCategoryId;

    // Group by the next level after the deepest selection
    if (selectedCategoryId) params.groupBy = "category";
    else if (selectedItemId) params.groupBy = "category";
    else if (selectedGenderId) params.groupBy = "item";
    else if (selectedMaterialId) params.groupBy = "gender";
    else params.groupBy = "material";

    return params;
  }, [selectedMaterialId, selectedGenderId, selectedItemId, selectedCategoryId]);

  const { data: categoryDistRaw } = useCategoryDistribution(distParams);
  const { data: stockTurnoverRaw } = useStockTurnover();

  const categoryDist = Array.isArray(categoryDistRaw?.data ?? categoryDistRaw) ? (categoryDistRaw?.data ?? categoryDistRaw) : [];
  const stockTurnover = Array.isArray(stockTurnoverRaw?.data ?? stockTurnoverRaw) ? (stockTurnoverRaw?.data ?? stockTurnoverRaw) : [];

  const changePage = ({ pageIndex }: { pageIndex: number }) => {
    setFilter((prev) => ({ ...prev, pageIndex: pageIndex }));
  };

  const { isLoading, data, isSuccess } = useGetProducts(filter);

  useEffect(() => {
    if (isSuccess) {
      const products: Product[] = Array.from(data.data.data.products);
      setproducts(products);
    }
  }, [isSuccess, data]);

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus();
  });
  useEffect(() => {
    setFilter({ search, pageIndex: 0, pageSize: 10, date: "" });
  }, [search]);

  // Reset child selections when parent changes
  const handleMaterialChange = (id: string) => {
    setSelectedMaterialId(id);
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
  };
  const handleGenderChange = (id: string) => {
    setSelectedGenderId(id);
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

  // Build breadcrumb trail
  const breadcrumb = useMemo(() => {
    const parts: string[] = [];
    if (selectedMaterialId) {
      const m = materials.find((x: any) => x._id === selectedMaterialId);
      if (m) parts.push(m.displayName || m.name);
    }
    if (selectedGenderId) {
      const g = genders.find((x: any) => x._id === selectedGenderId);
      if (g) parts.push(g.name);
    }
    if (selectedItemId) {
      const i = items.find((x: any) => x._id === selectedItemId);
      if (i) parts.push(i.name);
    }
    if (selectedCategoryId) {
      const c = categories.find((x: any) => x._id === selectedCategoryId);
      if (c) parts.push(c.name);
    }
    if (selectedSubcategoryId) {
      const s = subcategories.find((x: any) => x._id === selectedSubcategoryId);
      if (s) parts.push(s.name);
    }
    return parts;
  }, [selectedMaterialId, selectedGenderId, selectedItemId, selectedCategoryId, selectedSubcategoryId, materials, genders, items, categories, subcategories]);

  // Compute totals from distribution data
  const totals = useMemo(() => {
    const dist = categoryDist || [];
    return dist.reduce((acc: any, c: any) => ({
      total: acc.total + (c.total || 0),
      active: acc.active + (c.active || 0),
      inactive: acc.inactive + (c.inactive || 0),
      outOfStock: acc.outOfStock + (c.outOfStock || 0),
    }), { total: 0, active: 0, inactive: 0, outOfStock: 0 });
  }, [categoryDist]);

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
            {/* Material (Level 1) */}
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

            {/* Gender (Level 2) */}
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

            {/* Item (Level 3) */}
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

            {/* Category (Level 4) — depends on Material + Gender + Item */}
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

            {/* Subcategory (Level 5) — depends on Category */}
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
            {/* Summary badges */}
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

            {/* Breakdown table */}
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

        {/* Stock Turnover */}
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
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Products</CardTitle>
            <Input
              value={search}
              placeholder="Search products..."
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isSuccess && (
            <DataTable
              columns={ProductColumns}
              data={products}
              page={filter.pageIndex}
              totalPage={data.data?.data?.totalPage}
              changePage={changePage}
            />
          )}
          {isLoading && <LoadingScreen />}
        </CardContent>
      </Card>
    </section>
  );
};

export default ProductList;
