export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type CustomCaseMode = "build" | "surprise";

export type CustomCaseSelection = {
  mode: CustomCaseMode;
  productType: string;
  phoneModel?: string;
  theme?: string;
  style?: string;
  weight?: string;
  colour?: string;
  note: string;
};

export type ProductCartItem = {
  kind: "product";
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  mrpInr: number;
  priceInr: number;
  quantity: number;
  // Product's category at the time it was added — lets checkout know which
  // items are phone-case-shaped and need a phone model without a re-lookup.
  category: string;
  // Every "Existing Designs" piece can be recreated for any phone (see the
  // category description) — required at checkout for phone-case-shaped
  // items so we know which model to fit it to. Filled in on the checkout
  // page, not at add-to-cart time.
  phoneModel?: string;
};

export type CustomCartItem = {
  kind: "custom";
  id: string;
  name: string;
  image: string;
  mrpInr: number;
  priceInr: number;
  quantity: number;
  customization: CustomCaseSelection;
};

export type CartLineItem = ProductCartItem | CustomCartItem;

// Plain `Omit<CartLineItem, "quantity">` collapses the discriminated union to
// its common keys, so `addItem` needs an explicitly distributive version.
export type CartLineItemInput =
  | Omit<ProductCartItem, "quantity">
  | Omit<CustomCartItem, "quantity">;

export type ProductOrderItemSnapshot = {
  kind: "product";
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPriceInr: number;
  quantity: number;
  phoneModel?: string;
};

export type CustomOrderItemSnapshot = {
  kind: "custom";
  name: string;
  image: string;
  unitPriceInr: number;
  quantity: number;
  customization: CustomCaseSelection;
};

export type OrderItemSnapshot = ProductOrderItemSnapshot | CustomOrderItemSnapshot;

export type PaymentStatus = "pending" | "paid" | "failed";
export type PaymentProvider = "razorpay" | "paypal";
export type FulfillmentStatus = "unfulfilled" | "shipped" | "delivered" | "cancelled";

export type OrderRecord = {
  id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  shipping_address: ShippingAddress;
  // subtotal/discount_amount/shipping_amount/total_amount are all
  // denominated in `currency` — for a Razorpay order that's INR (using each
  // item's price_inr); for a PayPal order it's USD (using each item's
  // price_usd), computed independently rather than converted from the INR
  // figures. `unitPriceInr` on each item snapshot is likewise "unit price
  // in this order's currency" despite the name — kept as-is to avoid a
  // sitewide rename, since every order to date has been INR/Razorpay.
  items: OrderItemSnapshot[];
  subtotal: number;
  coupon_code: string | null;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency: "INR" | "USD";
  payment_status: PaymentStatus;
  payment_provider: PaymentProvider;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  fulfillment_status: FulfillmentStatus;
  tracking_number: string | null;
  courier: string | null;
  admin_notes: string | null;
  created_at: string;
};
