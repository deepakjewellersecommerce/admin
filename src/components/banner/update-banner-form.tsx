import { useGetBanner, useUpdateBanner } from "@/lib/react-query/banner-query"; // Assuming you have these hooks defined
import { useUploadImage } from "@/lib/react-query/auth-query";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router";
import LoadingScreen from "../common/loading-screen";
import BannerForm from "./banner-form"; // Assuming you have a BannerForm component defined
import { useMemo } from "react";

const UpdateBannerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: bannerData, isLoading } = useGetBanner(id ?? "");
  const { mutate: mutateBase, isPending } = useUpdateBanner();

  const uploadMutation = useUploadImage();

  const mutate = (payload: any) => {
    mutateBase(payload, {
      onSuccess: () => {
        setTimeout(() => navigate("/dashboard/banners/list"), 600);
      },
    });
  };

  const onSubmit = async (data: any) => {
    const images = data.bannerImages ?? data.images ?? [];
    const processed: string[] = [];

    try {
      const preset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET;
      const containsFile = images.some((img: any) => img && typeof img !== "string" && !(img?.url));
      if (containsFile && !preset) {
        // no preset on client: fallback to server-side upload using FormData
        const formData = new FormData();
        formData.append("title", String(data.title ?? ""));
        formData.append("content", String(data.content ?? ""));
        formData.append("isActive", String(Boolean(data.isActive)));
        const nonFiles = images.filter((i: any) => typeof i === "string" || i?.url).map((i: any) => (typeof i === 'string' ? i : i.url));
        nonFiles.forEach((s: string) => formData.append("bannerImages", s));
        images.filter((i: any) => i && typeof i !== "string" && !(i?.url)).forEach((f: File) => formData.append("bannerImages", f));
        formData.append("_id", id ?? "");
        mutate(formData);
        return;
      }
      for (const img of images) {
        if (!img) continue;
        if (typeof img === "string") {
          processed.push(img);
        } else if (img?.url) {
          processed.push(img.url);
        } else if (img.name && img.size) {
          const fd = new FormData();
          fd.append("file", img);
          // fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
          const res: any = await uploadMutation.mutateAsync(fd);
          const remoteUrl = res?.data?.secure_url ?? res?.data?.url;
          if (remoteUrl) processed.push(remoteUrl);
        } else if (Array.isArray(img)) {
          img.forEach((i: any) => {
            if (typeof i === "string") processed.push(i);
            else if (i?.url) processed.push(i.url);
          });
        }
      }
    } catch (err) {
      console.error("Image upload failed", err);
      toast.error("Failed to upload one or more images. Please try again.");
      return;
    }

    mutate({ ...data, bannerImages: processed, _id: id });
  };

  const defaultValues: any = useMemo(() => {
    if (!bannerData) return null;

    const banner = bannerData.data.data.banner;
    return {
      title: banner.title,
      content: banner.content,
      isActive: banner.isActive ?? true,
      bannerImages: banner.bannerImages,
    };
  }, [bannerData]);

  if (isLoading && !defaultValues) return <LoadingScreen />;

  if (!defaultValues) return null;
  
  return (
    <section className="flex flex-col space-y-4">
      <header className="border-b mb-10 pb-4">
        <h1 className="text-2xl font-bold">Update Banner</h1>
        <p className="text-sm text-gray-500">
          Update an existing banner in your store.
        </p>
      </header>
      <BannerForm
        isPending={isPending}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
      />
    </section>
  );
};

export default UpdateBannerForm;
