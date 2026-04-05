import { useEffect } from "react";
import { z } from "zod";
import FormProvider from "../form/FormProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "../form/FormInput";
import FormTextArea from "../form/FormTextArea";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import FormImageUploader from "../form/FormMultipleImages";
import FormSwitch from "../form/form-switch";
import { useGetProducts } from "@/lib/react-query/product-query";
import FormCombobox from "../form/FormCombobox";

const bannerSchema = z.object({
  title: z.string().min(1, "Banner title is required"),
  content: z.string().min(1, "Banner content is required"),
  isActive: z.boolean().default(true),
  // Accept either string urls or file objects.
  // We relax the schema to allow various shapes since the uploader stores Files or objects (existing urls)
  bannerImages: z.array(z.any()).optional(),
  product: z.string().optional(),
});

export type BannerType = z.infer<typeof bannerSchema>;

type Props = {
  onSubmit: (data: any) => void;
  defaultValues?: BannerType;
  isPending: boolean;
  onChange?: (data: Partial<BannerType> & { images?: any[] }) => void;
};

const BannerForm = ({ onSubmit, defaultValues, isPending, onChange }: Props) => {
  const form = useForm<BannerType>({
    resolver: zodResolver(bannerSchema),
    defaultValues: defaultValues ?? {
      title: "",
      content: "",
      isActive: true,
      bannerImages: [],
      product: "",
    },
  });

  const { data: productsData } = useGetProducts({ pageIndex: 0, pageSize: 200 });
  const productOptions = (productsData?.data?.data?.products ?? []).map(
    (p: { _id: string; title: string }) => ({ label: p.title, value: p._id })
  );

  // Notify parent on form data changes for preview updates
  useEffect(() => {
    if (!onChange) return;
    const subscription = form.watch((value) => {
      const images = (value as any).bannerImages ?? (value as any).images ?? [];
      onChange({ title: value.title ?? "", content: value.content ?? "", images });
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <main className="max-w-lg bg-white p-4 rounded-md mt-5">
      <FormProvider
        className="space-y-4"
        methods={form}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <h2 className="font-semibold text-gray-800 text-xl mb-4">Banner Form</h2>

        <FormInput
          control={form.control}
          name="title"
          placeholder="Enter Banner Title"
          label="Banner Title"
        />
        <FormImageUploader
          control={form.control}
          name="bannerImages"
          label="Banner Images"
         /> 

        <FormTextArea
          control={form.control}
          name="content"
          placeholder="Enter Banner Content"
          label="Banner Content"
        />
        <FormSwitch
          control={form.control}
          name="isActive"
          label="Banner Active"
          description="Only active banners should be considered live in admin filters."
        />

        <FormCombobox
          control={form.control}
          name="product"
          label="Related Product"
          options={productOptions}
        />

        <Button className="w-full mt-4" type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" size="sm" />}
          {isPending ? "Submitting..." : "Submit"}
        </Button>
      </FormProvider>
    </main>
  );
};

export default BannerForm;
