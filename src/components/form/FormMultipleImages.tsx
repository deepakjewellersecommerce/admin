/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getLinkFromJson } from "@/lib/utils";
import { X } from "lucide-react";
import React, { useState, ChangeEvent } from "react";
import {
  ArrayPath,
  Control,
  FieldValues,
  useFieldArray,
  useFormContext,
} from "react-hook-form";

function FormImageUploader<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
}: {
  label?: string;
  control: Control<TFieldValues>;
  className?: string;
  name: ArrayPath<TFieldValues> | any;
  description?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const { getFieldState, getValues, setValue } = useFormContext();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading] = useState(false);
  const error = getFieldState(name).error?.root;
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);

    if (newFiles.length === 0) return;

    // Allow up to 3 files total
    const existingFiles: File[] = (getValues(name) as File[]) || [];
    const spaceLeft = Math.max(0, 3 - existingFiles.length);
    const filesToAdd = newFiles.slice(0, spaceLeft);

    if (filesToAdd.length === 0) return;

    const updatedSelectedFiles = [...selectedFiles, ...filesToAdd];
    setSelectedFiles(updatedSelectedFiles);

    // create preview urls
    const newPreviews = filesToAdd.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    // store file objects in form under key 'images'
    setValue(name, [...existingFiles, ...filesToAdd], { shouldValidate: false, shouldDirty: true });
  };

  const handleRemove = (index: number) => {
    const updatedSelectedFiles = [...selectedFiles];
    const updatedPreviewUrls = [...previewUrls];

    updatedSelectedFiles.splice(index, 1);
    remove(index);
    updatedPreviewUrls.splice(index, 1);

    setSelectedFiles(updatedSelectedFiles);
    setPreviewUrls(updatedPreviewUrls);
  };

  const { remove, fields } = useFieldArray<any>({
    control,
    name,
  });

  // We no longer upload directly to Cloudinary here.
  // The selected File objects are stored in the form under 'images'.
  // The submit handler should create FormData and send files to the backend.
  // No direct upload here; we don't need a placeholder function anymore.

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Upload Images</h2>
      {/* Existing image URLs saved on product (from DB) */}
      {fields.length > 0 && (() => {
        const savedFields = (fields || []).filter((f: any) => {
          if (typeof f === 'string') return true;
          if (!f || typeof f !== 'object') return false;
          // detect File-like objects and exclude them
          if (typeof f.name === 'string' && typeof f.size === 'number') return false;
          // has url/secure_url => saved object
          if (f.url || f.secure_url) return true;
          // numeric key stored JSON (like Cloudinary-like split chars)
          const keys = Object.keys(f || {});
          if (keys.some(k => !isNaN(Number(k)))) return true;
          return false;
        });
        if (savedFields.length === 0) return null;
        return (
          <div className="flex p-2 bg-gray-100 border border-dashed rounded-sm mb-4 gap-6 flex-wrap">
            {savedFields.map((_previewUrl, index) => (
              <div key={`existing-${index}`} className="mb-4 relative">
                <img
                  src={getLinkFromJson(savedFields[index])}
                  alt={`Preview ${index + 1}`}
                  className={cn("w-28 h-28 rounded-sm object-contain bg-white")}
                />
                <Button
                  variant={"destructive"}
                  onClick={() => handleRemove(index)}
                  className=" w-7 h-7 absolute top-1 right-1"
                  size={"icon"}
                >
                  <X size={18} />
                </Button>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Local previews for newly selected files (not yet uploaded) */}
      {previewUrls.length > 0 && (
        <div className="flex p-2 bg-gray-50 border rounded-sm mb-4 gap-6 flex-wrap">
          {previewUrls.map((url, idx) => (
            <div key={`preview-${idx}`} className="mb-4 relative">
              <img src={url} alt={`Preview file ${idx + 1}`} className={cn("w-28 h-28 rounded-sm object-contain bg-white")} />
              <Button
                variant={"destructive"}
                onClick={() => {
                  // remove preview and corresponding file
                  const updatedPreviews = [...previewUrls];
                  updatedPreviews.splice(idx, 1);
                  setPreviewUrls(updatedPreviews);

                  const updatedFiles = [...selectedFiles];
                  updatedFiles.splice(idx, 1);
                  setSelectedFiles(updatedFiles);

                  const existingFiles: File[] = (getValues(name) as File[]) || [];
                  existingFiles.splice(idx, 1);
                  setValue(name, existingFiles, { shouldValidate: false, shouldDirty: true });
                }}
                className=" w-7 h-7 absolute top-1 right-1"
                size={"icon"}
              >
                <X size={18} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Input type="file" disabled={loading} multiple accept="image/*" onChange={handleFileChange} />
      {error && (
        <span className="text-red-500 mt-4 block text-sm font-semibold">
          {error?.message}
        </span>
      )}
    </div>
  );
}

export default FormImageUploader;
