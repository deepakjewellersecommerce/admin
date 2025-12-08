import { useAddBanner } from "@/lib/react-query/banner-query"; // Assuming you have this hook defined
import BannerForm from "./banner-form"; // Assuming you have a BannerForm component defined
import BannerPreview from "./banner-preview";
import React from "react";

const AddBannerForm = () => {
  const { mutate, isPending } = useAddBanner();
  const [previewData, setPreviewData] = React.useState<{ title?: string; content?: string; images?: any[] }>({});
  
  const onSubmit = (data: any) => {
    mutate(data);
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
