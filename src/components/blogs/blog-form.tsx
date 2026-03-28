import { z } from "zod";
import FormProvider from "../form/FormProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "../form/FormInput";
import FormTextArea from "../form/FormTextArea";
import FormImageInput from "../form/FormImage";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import FormGroupSelect from "../form/form-select";

const blogSchema = z.object({
  title: z.string(),
  content: z.string(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  displayImage: z.array(z.object({ url: z.string().url() })),
});

export type BlogType = z.infer<typeof blogSchema>;

type Props = {
  onSubmit: (data: any) => void;
  defaultValues?: BlogType;
  isPending: boolean;
};

const BlogForm = ({ onSubmit, defaultValues, isPending }: Props) => {
  const form = useForm<BlogType>({
    resolver: zodResolver(blogSchema),
    defaultValues: defaultValues ?? {
      title: "",
      content: "",
      status: "DRAFT",
      displayImage: [{ url: "" }],
    },
  });

  return (
    <main className="max-w-lg bg-white p-4 rounded-md  mt-20">
      <FormProvider
        className="space-y-4"
        methods={form}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <h2 className="font-semibold text-gray-800 text-xl mb-4">Blog Form</h2>

        <FormInput
          control={form.control}
          name="title"
          placeholder="Enter Blog Title"
          label="Blog Title"
        />
        <FormGroupSelect
          control={form.control}
          name="status"
          label="Status"
          placeholder="Select blog status"
          options={[
            { label: "Draft", value: "DRAFT" },
            { label: "Published", value: "PUBLISHED" },
          ]}
        />
        <div className="mt-4">
          <FormImageInput name="displayImage.0.url" label="Blog Image" />
          <div className="flex mt-2 items-center gap-2 font-semibold text-gray-700 w-full">
            <Separator className="w-[calc(50%-20px)]" /> OR{" "}
            <Separator className="w-[calc(50%-20px)]" />
          </div>
          <FormInput
            control={form.control}
            name="displayImage.0.url"
            placeholder="Enter Blog Image URL"
            label="Blog Image"
          />
        </div>

        <FormTextArea
          control={form.control}
          name="content"
          placeholder="Enter Blog Content"
          label="Blog Content"
        />

        <Button className="w-full mt-4" type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" size="sm" />}
          {isPending ? "Submitting..." : "Submit"}
        </Button>
      </FormProvider>
    </main>
  );
};

export default BlogForm;
