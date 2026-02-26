import { z } from "zod";
import FormProvider from "../form/FormProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "../form/FormInput";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import Colorful from "@uiw/react-color-colorful";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useEffect, useCallback, useRef } from "react";

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

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const ColorForm = ({ onSubmit, defaultValues, isPending }: Props) => {
  const form = useForm<ColorType>({
    resolver: zodResolver(colorSchema),
    defaultValues: defaultValues,
  });

  const hexcode = form.watch("hexcode");
  const colorName = form.watch("color_name");

  // Auto-generate slug from color name
  const slugTouched = useRef(false);
  useEffect(() => {
    if (!slugTouched.current && colorName) {
      form.setValue("slug", toSlug(colorName), { shouldValidate: false });
    }
  }, [colorName, form]);

  // Throttle color picker updates for smooth dragging
  const rafRef = useRef<number | null>(null);
  const handleColorChange = useCallback(
    (color: { hex: string }) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        form.setValue("hexcode", color.hex, { shouldValidate: false });
      });
    },
    [form]
  );

  const resetForm = () => {
    slugTouched.current = false;
    form.reset({
      color_name: "",
      slug: "",
      hexcode: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Color Details</CardTitle>
      </CardHeader>
      <CardContent>
        <FormProvider
          className="space-y-6"
          methods={form}
          onSubmit={form.handleSubmit((data) =>
            onSubmit(data, () => resetForm())
          )}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left — Form Fields */}
            <div className="space-y-4">
              <FormInput
                control={form.control}
                name="color_name"
                placeholder="Enter Color Title"
                label="Color Name"
              />
              <FormInput
                control={form.control}
                name="slug"
                placeholder="Auto-generated from color name"
                label="Color Slug"
                onFocus={() => { slugTouched.current = true; }}
              />
              <div className="flex gap-2 items-end">
                <FormInput
                  control={form.control}
                  name="hexcode"
                  className="w-full"
                  placeholder="Enter Color Hexcode"
                  label="Hex Code"
                />
                <div
                  className="w-10 h-9 rounded-md border-2 border-gray-300 shrink-0"
                  style={{ backgroundColor: `${hexcode}` }}
                />
              </div>
            </div>

            {/* Right — Color Picker */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm font-medium text-gray-700 self-start">
                Color Picker
              </p>
              <Colorful
                color={hexcode}
                disableAlpha={true}
                onChange={handleColorChange}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <Button className="w-full mt-4" type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" size="sm" />}
            {isPending ? "Loading..." : "Submit"}
          </Button>
        </FormProvider>
      </CardContent>
    </Card>
  );
};

export default ColorForm;
