import {
  useGetVariant,
  useGetProduct,
  useUpdateProductVariant,
} from "@/lib/react-query/product-query";
import ProductVariantForm, { ProductVariantType } from "./product-variant-form";
import { useParams, useNavigate } from "react-router";
import LoadingScreen from "../common/loading-screen";
import { useMemo } from "react";
import { sizeOptions } from "@/lib/utils";
import { useGetAllItems } from "@/lib/react-query/category-hierarchy-query";

const AddProductVariant = () => {
  const { productVariantId } = useParams();
  const navigate = useNavigate();
  const { isPending, mutate } = useUpdateProductVariant();
  const { isLoading, error, data } = useGetVariant(productVariantId);

  const variant = data?.data?.data?.variant;
  const variantProductId = variant?.productId ?? "";
  const { data: productData } = useGetProduct(variantProductId);
  const product = productData?.data?.data?.product ?? productData?.data?.product ?? null;
  const { data: itemsRaw } = useGetAllItems();
  const items = itemsRaw?.data?.items ?? itemsRaw?.items ?? [];
  const itemName = product?.itemId
    ? (items as any[]).find((i: any) => String(i._id) === String(product.itemId))?.name
    : undefined;

  const defaultValues: ProductVariantType = useMemo(() => {
    if (data?.data.data.variant === undefined)
      return {
        productId: "",
        size: "",
        customSize: "",
        price: "0",
        salePrice: "0",
        stock: "0",
        isActive: true,
        imageUrls: [],
      };
    const defaultValues: any = {};
    defaultValues.productId = data?.data.data.variant.productId;
    const rawSize = String(data?.data.data.variant.size);
    const isKnownSize = sizeOptions.some((opt) => opt.value === rawSize);
    defaultValues.size = isKnownSize ? rawSize : "Custom";
    defaultValues.customSize = isKnownSize ? "" : rawSize;
    defaultValues.isActive = data?.data.data.variant.isActive;
    defaultValues.imageUrls = data?.data.data.variant.imageUrls || [];
    defaultValues.stock = String(data?.data.data.variant.stock);
    defaultValues.price = String(data?.data.data.variant.price);
    defaultValues.salePrice = String(data?.data.data.variant.salePrice);

    const rawColor = data?.data.data.variant.color;
    defaultValues.color = rawColor && typeof rawColor === "object" ? rawColor._id : (rawColor ?? "");
    defaultValues.weight = data?.data.data.variant.weight != null ? String(data?.data.data.variant.weight) : "";
    defaultValues.gemstones = data?.data.data.variant.gemstones || [];

    return defaultValues;
  }, [data]);

  if (isLoading) return <LoadingScreen />;

  if (!productVariantId)
    return (
      <div className=" h-screen flex justify-center items-center w-screen">
        <h1>Product not found</h1>
      </div>
    );

  if (error)
    return (
      <div className=" h-screen flex justify-center items-center w-screen">
        <h1>Product not found</h1>
      </div>
    );

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      _id: productVariantId,
      size: data.size === "Custom" && data.customSize ? data.customSize : data.size,
      stock: Number(data.stock),
      price: Number(data.price),
      salePrice: Number(data.salePrice),
      color: data.color || undefined,
      weight: data.weight ? Number(data.weight) : undefined,
      gemstones: data.gemstones || [],
      productId: data?.productId ?? "",
      imageUrls: data.imageUrls || [],
      images: data.images || [],
    };
    delete payload.customSize;
    mutate(payload, {
      onSuccess: () => {
        navigate(`/dashboard/products/view/${payload.productId}`);
      },
    });
  };

  return (
    <section className="flex flex-col space-y-4">
      <header className="border-b mb-6 pb-4">
        <h1 className="text-2xl font-bold">Edit Product Variant</h1>
        <p className="text-sm text-gray-500">
          Update variant details
        </p>
      </header>{" "}
      <ProductVariantForm
        defaultValues={defaultValues}
        isPending={isPending}
        onSubmit={onSubmit}
        productPrice={product?.regularPrice ?? product?.calculatedPrice ?? product?.staticPrice}
        productSalePrice={product?.salePrice}
        productTitle={product?.productTitle}
        itemName={itemName || product?.productTitle}
        isEdit
        currentStock={variant?.stock ?? 0}
        productNetWeight={product?.netWeight}
      />
    </section>
  );
};

export default AddProductVariant;
