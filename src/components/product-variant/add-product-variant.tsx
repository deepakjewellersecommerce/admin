import { useAddProductVariant, useGetProduct } from "@/lib/react-query/product-query";
import { useGetAllItems } from "@/lib/react-query/category-hierarchy-query";
import ProductVariantForm, { ProductVariantType } from "./product-variant-form";
import { useParams, useNavigate } from "react-router";

const AddProductVariant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPending, mutate } = useAddProductVariant();
  const { data: productData } = useGetProduct(id ?? "");
  const product = productData?.data?.data?.product ?? productData?.data?.product ?? null;
  const { data: itemsRaw } = useGetAllItems();
  const items = itemsRaw?.data?.items ?? itemsRaw?.items ?? [];
  const itemName = product?.itemId
    ? (items as any[]).find((i: any) => String(i._id) === String(product.itemId))?.name
    : undefined;

  const onSubmit = (data: any) => {
    mutate(
      {
        productId: data.productId,
        size: data.size === "Custom" && data.customSize ? data.customSize : data.size,
        price: Number(data.price),
        salePrice: Number(data.salePrice),
        stock: Number(data.stock),
        color: data.color || undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        gemstones: data.gemstones || [],
        images: data.images || [],
      },
      {
        onSuccess: () => {
          navigate(`/dashboard/products/view/${id}`);
        },
      }
    );
  };

  if (!id)
    return (
      <div className=" h-screen flex justify-center items-center w-screen">
        <h1>Product not found</h1>
      </div>
    );

  const defaultValues: ProductVariantType = {
    productId: id ?? "",
    size: "",
    customSize: "",
    color: "",
    price: "0",
    salePrice: "0",
    weight: "",
    stock: "0",
    isActive: true,
    gemstones: [],
    imageUrls: [],
  };
  return (
    <section className="flex flex-col space-y-4">
      <header className="border-b mb-6 pb-4">
        <h1 className="text-2xl font-bold">Product Variant</h1>
        <p className="text-sm text-gray-500">
          Add a new product variant to the product
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
        productNetWeight={product?.netWeight}
      />
    </section>
  );
};

export default AddProductVariant;
