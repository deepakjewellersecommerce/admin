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
        .then((result: any) => {
          setImportAllData(result);
          const brandId = options.find(
            (brand: { label: any }) =>
              String(brand.label).toLocaleLowerCase() ==
              String(result.importData[0]["BRAND"]).toLocaleLowerCase()
          );
          setSelectedBrand(brandId?.value??"");
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
        <main className="mt-10 bg-white rounded-xl p-4">
          <div>
            <h2 className="text-xl font-semibold">Preview</h2>
            {importAllData && (
              <div className="flex flex-col space-y-2 mt-4 font-medium">
                <span>
                  {" "}
                  Product Name : {importAllData.importData[0]["PRODUCT NAME"]}
                </span>
                <span>
                  {" "}
                  Product Code : {importAllData.importData[0]["CODE"]}
                </span>
                <span> Product MRP : {importAllData.importData[0]["MRP"]}</span>
                <span>
                  {" "}
                  Product Selling Price :{" "}
                  {importAllData.importData[0]["SELLING PRICE"]}
                </span>
                <span>
                  {" "}
                  Product Description :{" "}
                  {importAllData.importData[0]["DESCRIPTION"]}
                </span>
                <span>
                  {" "}
                  Product Brand : {importAllData.importData[0]["BRAND"]}
                </span>
              </div>
            )}
          </div>
        </main>
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
    productImageUrl: mainProductData["Main Image URL"],
    salePrice: Number(mainProductData["SELLING PRICE"]),
    productDescription: mainProductData["DESCRIPTION"],
    brand: mainProductData["BRAND"],
    varients: [],
    images: [],
  };

  const productImages = () => {
    const productMap = new Map();

    productsData.forEach((productData) => {
      if (productData["Main Image URL"]) {
        const images = [productData["Main Image URL"]]; // Initialize images array with main image URL
        let i = 1;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (productData[`Other Image URL ${i}`]) {
            images.push(productData[`Other Image URL ${i}`]); // Add other image URLs to images array
            i++; // Increment i
          } else {
            break;
          }
        }
        productMap.set(productData["COLOR"], images); // Set color as key and images array as value in the productMap
      }
    });

    return productMap;
  };

  const imagesMap = productImages();

  imagesMap.forEach((images, color) => {
    if (product.images) product.images.push({ color, images });
  });

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
