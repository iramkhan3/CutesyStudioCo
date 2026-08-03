"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore, cartSubtotalUsd, cartSubtotalInr } from "@/lib/store/cart";
import { calculateDiscount } from "@/lib/coupons";
import { calculateShipping } from "@/lib/shipping";
import { FREE_SHIPPING_THRESHOLD_INR, USD_TO_INR_REFERENCE_RATE } from "@/lib/constants";
import { GiftIcon, MinusIcon, PlusIcon, SparkleIcon, TrashIcon, WandIcon } from "@/components/Icons";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const couponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const clearCoupon = useCartStore((s) => s.clearCoupon);

  const [couponInput, setCouponInput] = useState("");

  const subtotalUsd = cartSubtotalUsd(items);
  const subtotalInr = cartSubtotalInr(items);
  const { discount, coupon, error: couponError } = calculateDiscount(subtotalInr, couponCode);
  const shippingInr = calculateShipping(subtotalInr);
  const totalInr = Math.max(0, subtotalInr - discount) + shippingInr;

  function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    applyCoupon(couponInput);
    setCouponInput("");
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <SparkleIcon className="h-10 w-10 text-lavender-dark" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink">Your cart is empty</h1>
        <p className="mt-2 text-ink/60">
          Nothing here yet — go find something covered in charms and bows.
        </p>
        <Link href="/shop" className="btn-primary mt-6">
          Browse the Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">Your Cart</h1>

      <div className="mt-8 flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.id} className="card flex items-center gap-4 p-4">
            {item.kind === "product" ? (
              <Link href={`/shop/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl2 bg-blush-light">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </Link>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl2 bg-blush-light">
                {item.customization.mode === "surprise" ? (
                  <GiftIcon className="h-8 w-8 text-pastel" />
                ) : (
                  <WandIcon className="h-8 w-8 text-pastel" />
                )}
              </div>
            )}

            <div className="flex-1">
              {item.kind === "product" ? (
                <Link href={`/shop/${item.slug}`} className="font-heading font-semibold text-ink hover:text-pastel">
                  {item.name}
                </Link>
              ) : (
                <div className="font-heading font-semibold text-ink">{item.name}</div>
              )}
              <div className="mt-1 text-sm text-ink/60">
                ${item.priceUsd} <span className="text-ink/40">(≈ ₹{item.priceInr})</span>
              </div>
              {item.kind === "custom" && (
                <p className="mt-1 max-w-xs truncate text-xs text-ink/50">
                  {item.customization.mode === "build"
                    ? `${item.customization.phoneModel} · ${item.customization.theme}`
                    : item.customization.note}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-full border-2 border-ink/10 px-2 py-1">
              <button
                aria-label="Decrease quantity"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="rounded-full p-1 text-ink/70 hover:bg-blush-light"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="w-5 text-center font-heading text-sm font-semibold">{item.quantity}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="rounded-full p-1 text-ink/70 hover:bg-blush-light"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="w-16 text-right font-heading font-semibold text-ink">
              ${(item.priceUsd * item.quantity).toFixed(2)}
            </div>

            <button
              aria-label={`Remove ${item.name}`}
              onClick={() => removeItem(item.id)}
              className="rounded-full p-2 text-ink/40 hover:bg-blush-light hover:text-pastel"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-5">
        <span className="font-heading text-sm font-semibold text-ink/70">Coupon Code</span>
        {couponCode ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-sm text-ink/70">
              {coupon ? (
                <>
                  <span className="font-semibold text-pastel">{coupon.code}</span> applied — {coupon.percentOff}% off
                </>
              ) : (
                <span className="text-pastel-dark">{couponError || "This code isn't valid for your cart yet."}</span>
              )}
            </div>
            <button
              onClick={clearCoupon}
              className="font-heading text-xs font-semibold text-ink/50 underline hover:text-pastel"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 rounded-xl2 border-2 border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-pastel focus:outline-none"
            />
            <button onClick={handleApplyCoupon} className="btn-secondary">
              Apply
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-end gap-2 border-t border-ink/10 pt-6">
        <div className="flex w-full max-w-xs justify-between text-sm text-ink/60">
          <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span>${subtotalUsd.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex w-full max-w-xs justify-between text-sm text-pastel-dark">
            <span>Discount ({coupon?.code})</span>
            <span>-₹{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex w-full max-w-xs justify-between text-sm text-ink/60">
          <span>Shipping</span>
          <span>{shippingInr === 0 ? "Free" : `₹${shippingInr.toFixed(2)}`}</span>
        </div>
        <div className="font-heading text-2xl font-bold text-ink">
          ₹{totalInr.toFixed(2)}{" "}
          <span className="text-sm font-normal text-ink/50">≈ ${(totalInr / USD_TO_INR_REFERENCE_RATE).toFixed(2)}</span>
        </div>
        <p className="text-xs text-ink/50">
          {shippingInr === 0
            ? "You'll be charged in INR at checkout."
            : `Add ₹${(FREE_SHIPPING_THRESHOLD_INR - subtotalInr).toFixed(2)} more to get free shipping.`}
        </p>
        <Link href="/checkout" className="btn-primary mt-4">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
