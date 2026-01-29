import { z } from "zod";
import FormProvider from "../form/FormProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "../form/FormInput";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import Colorful from "@uiw/react-color-colorful";

const colorSchema = z.object({
  color_name: z
    .string()
    .min(3, { message: "Color Name must be atleast 3 characters long" }),
  slug: z
    .string()
    .min(1, { message: "Color Slug must be atleast 1 characters long" }),
  hexcode: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid Hexcode"),
});

export type ColorType = z.infer<typeof colorSchema>;

type Props = {
  onSubmit: (data: any, onSuccess?: () => void) => void;
  defaultValues?: ColorType;
  isPending: boolean;
};

const ColorForm = ({ onSubmit, defaultValues, isPending }: Props) => {
  const form = useForm<ColorType>({
    resolver: zodResolver(colorSchema),
    defaultValues: defaultValues,
  });

  const { hexcode } = form.watch();


  const resetForm = () => {
    form.reset({
      color_name: "",
      slug: "",
      hexcode: "",
    });
  };
  return (
    <main className="max-w-lg bg-white p-4 rounded-md  ">
      <FormProvider
        className="space-y-4"
        methods={form}
        onSubmit={form.handleSubmit((data) =>
          onSubmit(data, () => resetForm())
        )}
      >
        <h2 className="font-semibold text-gray-800 text-xl mb-4">Color Form</h2>

        <FormInput
          control={form.control}
          name="color_name"
          placeholder="Enter Color Title"
          label="Color Title"
        />
        <FormInput
          control={form.control}
          name="slug"
          placeholder="Enter Color Slug"
          label="Color Slug"
        />
        <div className="flex gap-2 items-end">
          <FormInput
            control={form.control}
            name="hexcode"
            className="w-full"
            placeholder="Enter Color Hexcode"
            label="Color Hexcode"
          />
          <div
            className="w-10  h-9 rounded-md border-2 border-blue-400"
            style={{ backgroundColor: `${hexcode}` }}
          ></div>
        </div>
        <Colorful
          color={hexcode}
          disableAlpha={true}
          onChange={(color) => {
            form.setValue("hexcode", color.hex);
          }}
        />

        <Button className="w-full mt-4" type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" size="sm" />}
          {isPending ? "Loading..." : "Submit"}
        </Button>
      </FormProvider>
    </main>
  );
};

export default ColorForm;
