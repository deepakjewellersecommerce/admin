import { useAddCoupon } from "@/lib/react-query/coupon-query";
import { useNavigate } from "react-router";
import CouponForm, { CouponType } from "./coupon-form";

const defaultValues: CouponType = {
  couponCode: "",
  couponAmount: "0",
  couponQuantity: "0",
  couponType: "PERCENTAGE",
  minCartAmount: "0",
  expiryDate: new Date(),
};

const AddCouponForm = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useAddCoupon();

  const onSubmit = (data: any) => {
    mutate({
      ...data,
      couponAmount: parseInt(data.couponAmount),
      minCartAmount: parseInt(data.minCartAmount),
      discount: parseInt(data.discount),
      couponQuantity: parseInt(data.couponQuantity),
    }, {
      onSuccess: () => {
        setTimeout(() => navigate("/dashboard/coupons/list"), 600);
      },
    });
  };

  return (
    <div>
      <header className="border-b mb-6 pb-4">
        <h1 className="text-2xl font-bold">Add Coupon</h1>
        <p className="text-sm text-gray-500">Add a new coupon to your store.</p>
      </header>{" "}
      <CouponForm
        isPending={isPending}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default AddCouponForm;
