import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { parseXLSXFile } from "@/lib/exel";
import UploadBox from "../ui/upload-document";
import { useUploadProducts } from "@/lib/react-query/product-query";
import Product from "./product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useGetCategories } from "@/lib/react-query/category-query";
import { toast } from "sonner";
import { useGetBrandOptions } from "@/lib/react-query/brand-query";
import { Label } from "../ui/label";

const UploadProducts = () => {
  const [importAllData, setImportAllData] = useState<any>(null);
  const { isPending, mutate } = useUploadProducts();
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const { options } = useGetBrandOptions();

  const handleUpload = () => {
    if (!importAllData) return;
    const products = importAllData.importData;
    const product = createProductWithVariants(products);
    product.category = selectedCategory;
    product.brand = selectedBrand;
    if (!product.category) return toast.error("Please select category");
    if (!product.brand) return toast.error("Please select brand");
    mutate({ products: [product] });
  };
  const handleDropSheet = (acceptedFiles: any[]) => {
    const file = acceptedFiles[0];

    if (file) {
      parseXLSXFile(file)
        .then((result) => {
          setImportAllData(result);
        })
        .catch((error) => {
          console.error("Error parsing XLSX file:", error);
        });
    }
  };

  const { data, isLoading } = useGetCategories();

  const categoryOptions = useMemo(() => {
    if (data)
      return Array.from(data.data.categories).map((category: any) => ({
        label: category.name,
        value: category._id,
      }));

    return [];
  }, [data]);

  return (
    <>
      <h1 className="text-xl mb-4 font-semibold">Upload Products</h1>
      <section>
        <div className="mb-4 flex gap-4">
          <div>
            <Label>Category</Label>
            <Select
              onValueChange={(value) => setSelectedCategory(value)}
              value={selectedCategory}
            >
              <SelectTrigger disabled={isLoading} className="w-[180px]">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Brand</Label>
            <Select
              onValueChange={(value) => setSelectedBrand(value)}
              value={selectedBrand}
            >
              <SelectTrigger disabled={isLoading} className="w-[180px]">
                <SelectValue placeholder="Select Brand" />
              </SelectTrigger>
              <SelectContent>
                {options.map((brand: any) => (
                  <SelectItem key={brand.value} value={brand.value}>
                    {brand.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <UploadBox
            onDrop={handleDropSheet}
            placeholder={
              <div className="flex items-center flex-col space-y-2">
                <p>Drag & Drop or import file here</p>
                <Button variant="outline">Browse File</Button>
                <p>File format must be .xlsx</p>
              </div>
            }
          />
          {importAllData && (
            <div>
              <p>
                {" "}
                Product Varients are selected :{" "}
                {importAllData.importData.length}
              </p>
            </div>
          )}
          <div className="mt-4">
            <Button
              disabled={isPending || !importAllData}
              onClick={() => handleUpload()}
            >
              {isPending
                ? "Uploading..."
                : importAllData
                ? "Upload"
                : "Select File"}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default UploadProducts;

function createProductWithVariants(productsData: any[]): Product {
  if (productsData.length === 0) {
    throw new Error("No product data available");
  }

  const mainProductData = productsData[0];

  const product: Product = {
    productTitle: mainProductData["PRODUCT NAME"],
    productSlug: mainProductData["CODE"],
    skuNo: mainProductData["CODE"],
    isActive: true,
    regularPrice: Number(mainProductData["MRP"]),
    salePrice: Number(mainProductData["SELLING PRICE"]),
    productDescription: `Color: ${mainProductData["COLOR"]}, Size: ${mainProductData["SIZE"]}, Fabric: ${mainProductData["FABRIC"]}, Packaging Dimensions: ${mainProductData["PACKGING DIMENION"]}`,
    brand: mainProductData["BRAND"],
    varients: [],
  };

  productsData.forEach((productData) => {
    const variant: any = {
      size: productData["SIZE"],
      price: Number(productData["MRP"]),
      salePrice: Number(productData["SELLING PRICE"]),
      stock: parseInt(productData["QTY"]),
      color: productData["COLOR"],
      sku: productData["SKU"],
    };

    if (product.varients) product.varients.push(variant);
  });

  return product;
}
