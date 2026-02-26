import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useGetCoupon, useUpdateCoupon } from "@/lib/react-query/coupon-query";
import LoadingScreen from "../common/loading-screen";
import CouponForm from "../coupons/coupon-form";

const EditCouponForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useGetCoupon(id);

  const { mutate, isPending } = useUpdateCoupon();

  const defaultValues:any = useMemo(() => {
    if (data?.data.data) {
      const coupon = data.data.data.coupon;
      return {
        couponCode: coupon.couponCode,
        couponAmount: String(coupon.couponAmount),
        couponType: String(coupon.couponType),
        couponQuantity: String(coupon.couponQuantity),
        minCartAmount: String(coupon.minCartAmount),
        expiryDate: new Date(coupon.expiryDate),
      };
    }

    return null;
  }, [data]);

  if (!defaultValues) return <LoadingScreen />;

  const onSubmit = (values: any) => {
    mutate({ ...values, _id: id }, {
      onSuccess: () => {
        setTimeout(() => navigate("/dashboard/coupons/list"), 600);
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
      <CouponForm
        defaultValues={defaultValues}
        isPending={isPending}
        onSubmit={onSubmit}
      />
    </section>
  );
};

export default EditCouponForm;
