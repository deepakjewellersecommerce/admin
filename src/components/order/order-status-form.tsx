import FormProvider from "../form/FormProvider";
import FormInput from "../form/FormInput";

import { useForm } from "react-hook-form";
import FormGroupSelect from "../form/form-select";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { useUpdateOrder } from "@/lib/react-query/order-query";
import { toast } from "sonner";
import { useParams } from "react-router";
import { Textarea } from "../ui/textarea";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";

const OrderStatusEnum = z.enum([
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_ADMIN",
  "RETURNED",
  "REFUNDED",
]);

const DELIVERY_PARTNERS = [
  "Delhivery",
  "Shiprocket",
  "BlueDart",
  "India Post",
  "DTDC",
  "Other",
] as const;

const orderSchema = z.object({
  order_status: OrderStatusEnum,
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
  adminNote: z.string().optional(),
  deliveryPartner: z.string().optional(),
  shippingCostToPartner: z.coerce.number().min(0).optional(),
});

export type OrderFormType = z.infer<typeof orderSchema>;

type Props = {
  defaultValues: OrderFormType;
};

const ALL_STATUS_OPTIONS: Record<string, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED_BY_CUSTOMER: "Cancelled by Customer",
  CANCELLED_BY_ADMIN: "Cancelled by Admin",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

// Must mirror backend VALID_STATUS_TRANSITIONS exactly
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  PLACED:                ["CONFIRMED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_ADMIN"],
  CONFIRMED:             ["PROCESSING", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_ADMIN"],
  PROCESSING:            ["SHIPPED", "CANCELLED_BY_ADMIN"],
  SHIPPED:               ["OUT_FOR_DELIVERY", "CANCELLED_BY_ADMIN"],
  OUT_FOR_DELIVERY:      ["DELIVERED", "CANCELLED_BY_ADMIN"],
  DELIVERED:             ["RETURNED"],
  CANCELLED_BY_CUSTOMER: ["REFUNDED"],
  CANCELLED_BY_ADMIN:    ["REFUNDED"],
  RETURNED:              ["REFUNDED"],
  REFUNDED:              [],
};

function getStatusOptions(currentStatus: string) {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  // Include current status (so dropdown shows current) + valid next statuses
  const statuses = [currentStatus, ...allowed];
  return statuses.map((s) => ({
    label: ALL_STATUS_OPTIONS[s] || s,
    value: s,
  }));
}

const SHIPPING_STATUSES = ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

const OrderStatusForm = ({ defaultValues }: Props) => {
  const { id } = useParams();
  const { mutate, isPending } = useUpdateOrder();
  const form = useForm<OrderFormType>({
    resolver: zodResolver(orderSchema),
    defaultValues: defaultValues,
  });

  const currentStatus = defaultValues.order_status;
  const statusOptions = getStatusOptions(currentStatus);

  const watchedStatus = form.watch("order_status");
  const showTracking = SHIPPING_STATUSES.includes(watchedStatus);

  const onSubmit = (data: OrderFormType) => {
    mutate(
      { ...data, _id: id },
      {
        onSuccess: () => {
          toast.success("Order Status Updated");
        },
        onError: (error) => {
          toast.error(error.message ?? "Failed to update order status");
        },
      }
    );
  };

  return (
    <FormProvider
      className="space-y-4"
      methods={form}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-4">
        <FormGroupSelect
          options={statusOptions}
          control={form.control}
          name="order_status"
          label="Status"
        />

        {showTracking && (
          <>
            <FormInput
              control={form.control}
              name="trackingNumber"
              label="Tracking Number"
              placeholder="Enter tracking number"
            />
            <FormInput
              control={form.control}
              name="trackingUrl"
              label="Tracking URL"
              placeholder="https://..."
            />
            <FormField
              control={form.control}
              name="deliveryPartner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Partner</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...field}
                      value={field.value || ""}
                    >
                      <option value="">Select delivery partner</option>
                      {DELIVERY_PARTNERS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shippingCostToPartner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Cost Paid (₹)</FormLabel>
                  <FormControl>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="adminNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add a note about this status update..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size={"sm"}
          className="w-full flex justify-center"
          disabled={isPending}
        >
          {isPending && <Loader2 className="animate-spin mr-2" size={18} />}
          {isPending ? "Updating..." : "Update Status"}
        </Button>
      </div>
    </FormProvider>
  );
};

export default OrderStatusForm;
