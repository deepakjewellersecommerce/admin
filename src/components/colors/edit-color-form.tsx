import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useGetColorById, useUpdateColor } from "@/lib/react-query/color-query";
import LoadingScreen from "../common/loading-screen";
import ColorForm, { ColorType } from "../colors/color-form";

const EditColorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useGetColorById(id ?? "");

  const { mutate, isPending } = useUpdateColor();

  const defaultValues: ColorType | null = useMemo(() => {
    if (data?.data) {
      const color = data.data.data.color; // Assuming color data is directly available
      return {
        slug: color.slug,
        color_name: color.color_name,
        hexcode: color.hexcode,
      } as ColorType;
    }
    return null;
  }, [data]);

  if (!defaultValues) return <LoadingScreen />;

  const onSubmit = (values: any) => {
    mutate({ ...values, _id: id }, {
      onSuccess: () => {
        setTimeout(() => navigate("/dashboard/colors/list"), 600);
      },
    });
  };

  return (
    <section className="flex flex-col space-y-4">
      <header className="border-b mb-6 pb-4">
        <h1 className="text-2xl mb-1 font-bold">Update Color</h1>
        <p className="text-sm text-gray-500">
          Change the color details and click on Submit
        </p>
      </header>
      <ColorForm
        defaultValues={defaultValues}
        isPending={isPending}
        onSubmit={onSubmit}
      />
    </section>
  );
};

export default EditColorForm;
