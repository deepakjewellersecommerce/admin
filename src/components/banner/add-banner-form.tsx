import { useAddBanner } from "@/lib/react-query/banner-query"; // Assuming you have this hook defined
import { useUploadImage } from "@/lib/react-query/auth-query";
import { toast } from "sonner";
import BannerForm from "./banner-form"; // Assuming you have a BannerForm component defined
import BannerPreview from "./banner-preview";
import React from "react";
import { useNavigate } from "react-router";

const AddBannerForm = () => {
  const navigate = useNavigate();
  const { mutate: mutateBase, isPending } = useAddBanner();
  const [previewData, setPreviewData] = React.useState<{ title?: string; content?: string; images?: any[] }>({});

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
        // no client side preset: fall back to server uploading via FormData
        const formData = new FormData();
        formData.append("title", String(data.title ?? ""));
        formData.append("content", String(data.content ?? ""));
        const nonFiles = images.filter((i: any) => typeof i === "string" || i?.url).map((i: any) => (typeof i === 'string' ? i : i.url));
        nonFiles.forEach((s: string) => formData.append("bannerImages", s));
        images.filter((i: any) => i && typeof i !== "string" && !(i?.url)).forEach((f: File) => formData.append("bannerImages", f));
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
          // File object - upload to Cloudinary from client
          if (preset) {
            const fd = new FormData();
            fd.append("file", img);
            const res: any = await uploadMutation.mutateAsync(fd);
            const remoteUrl = res?.data?.secure_url ?? res?.data?.url;
            if (remoteUrl) processed.push(remoteUrl);
          } else {
            // No preset on client-side -> send file to backend as FormData instead (server will upload to Cloudinary)
            const formData = new FormData();
            formData.append("title", String(data.title ?? ""));
            formData.append("content", String(data.content ?? ""));
            // append any string urls present in images
            const nonFiles = images.filter((i: any) => typeof i === "string" || i?.url).map((i: any) => (typeof i === 'string' ? i : i.url));
            nonFiles.forEach((s: string) => formData.append("bannerImages", s));
            // append all file objects
            images.filter((i: any) => i && typeof i !== "string" && !(i?.url)).forEach((f: File) => formData.append("bannerImages", f));
            mutate(formData);
            return;
          }
        } else if (Array.isArray(img)) {
          // handle nested arrays (if any) by flattening
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

    const payload = { ...data, bannerImages: processed };
    mutate(payload);
  };
  
  return (
    <section className="flex flex-col space-y-4">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">Add Banner</h1>
        <p className="text-sm text-gray-500">
          Add a new banner to your store.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col justify-center h-full self-start">
          <BannerForm isPending={isPending} onSubmit={onSubmit} onChange={setPreviewData} />
        </div>
        <div className="flex flex-col justify-center h-full">
          <BannerPreview title={previewData.title} content={previewData.content} images={previewData.images} />
        </div>
      </div>
    </section>
  );
};

export default AddBannerForm;
