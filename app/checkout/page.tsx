"use client";
import { useCart } from "@/context/CartContext";
import { DEFAULT_DELIVERY_CHARGE, DEFAULT_FREE_DELIVERY_THRESHOLD, getDeliveryCharge } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

declare global {
    interface Window { Razorpay: any; }
}

type FormFields = "name" | "email" | "phone" | "address" | "city" | "pincode";

export default function CheckoutPage() {
    const { cartItems, totalPrice, clearCart, validateStock } = useCart();
    const router = useRouter();

    const [deliveryChargeAmount, setDeliveryChargeAmount] = useState(DEFAULT_DELIVERY_CHARGE);
    const [freeThreshold, setFreeThreshold] = useState(DEFAULT_FREE_DELIVERY_THRESHOLD);

    useEffect(() => {
        fetch("/api/delivery-settings")
            .then((res) => res.json())
            .then((data) => {
                setDeliveryChargeAmount(data.delivery_charge ?? DEFAULT_DELIVERY_CHARGE);
                setFreeThreshold(data.free_delivery_threshold ?? DEFAULT_FREE_DELIVERY_THRESHOLD);
            })
            .catch(() => {});
    }, []);

    const deliveryCharge = getDeliveryCharge(totalPrice, deliveryChargeAmount, freeThreshold);
    const grandTotal = totalPrice + deliveryCharge;

    const [loading, setLoading] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [form, setForm] = useState<Record<FormFields, string>>({
        name: "", email: "", phone: "", address: "", city: "", pincode: "",
    });
    const [errors, setErrors] = useState<Partial<Record<FormFields, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<FormFields, boolean>>>({});
    const [generalError, setGeneralError] = useState("");

    const validateField = (field: FormFields, value: string): string | undefined => {
        const trimmed = value.trim();

        switch (field) {
            case "name":
                if (!trimmed) return "Full name is required";
                if (trimmed.length < 2) return "Name must be at least 2 characters";
                if (trimmed.length > 60) return "Name is too long";
                if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return "Name can only contain letters, spaces, and . ' -";
                return;

            case "email":
                if (!trimmed) return "Email is required";
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return "Enter a valid email address";
                return;

            case "phone":
                if (!trimmed) return "Phone number is required";
                if (!/^[6-9]\d{9}$/.test(trimmed)) return "Enter a valid 10-digit Indian mobile number";
                return;

            case "address":
                if (!trimmed) return "Address is required";
                if (trimmed.length < 5) return "Please enter a complete address";
                if (trimmed.length > 200) return "Address is too long (max 200 chars)";
                return;

            case "city":
                if (!trimmed) return "City is required";
                if (trimmed.length < 2) return "Enter a valid city name";
                if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return "City can only contain letters and spaces";
                return;

            case "pincode":
                if (!trimmed) return "Pincode is required";
                if (!/^\d{6}$/.test(trimmed)) return "Enter a valid 6-digit pincode";
                return;
        }
    };

    const validateAll = (): boolean => {
        const newErrors: Partial<Record<FormFields, string>> = {};
        (Object.keys(form) as FormFields[]).forEach((field) => {
            const err = validateField(field, form[field]);
            if (err) newErrors[field] = err;
        });
        setErrors(newErrors);
        // Mark all as touched so errors render
        setTouched({
            name: true, email: true, phone: true, address: true, city: true, pincode: true,
        });
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        // Re-validate this field if already touched
        if (touched[name as FormFields]) {
            const err = validateField(name as FormFields, value);
            setErrors((prev) => ({ ...prev, [name]: err }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouched({ ...touched, [name]: true });
        const err = validateField(name as FormFields, value);
        setErrors((prev) => ({ ...prev, [name]: err }));
    };

    const handlePayment = async () => {
        setGeneralError("");

        // Validate form fields
        if (!validateAll()) {
            // Scroll to top of form
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setLoading(true);

        try {
            // Stock validation right before payment
            const stockIssues = await validateStock();
            if (stockIssues.length > 0) {
                setLoading(false);
                setGeneralError("Some items in your cart are no longer available. Returning you to the cart...");
                setTimeout(() => router.push("/cart"), 2000);
                return;
            }

            // Step 1 — create Razorpay order. Send the cart so the server
            // can recompute the amount itself; never trust client prices.
            const res = await fetch("/api/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cartItems: cartItems.map((item) => ({
                        id: item.id,
                        selectedSize: item.selectedSize,
                        quantity: item.quantity,
                    })),
                }),
            });
            const order = await res.json();
            if (!res.ok || !order.id) {
                setLoading(false);
                setGeneralError(order.error ?? "Could not create order. Please try again.");
                return;
            }

            // Step 2 — load Razorpay script
            await new Promise<void>((resolve) => {
                if (window.Razorpay) return resolve();
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = () => resolve();
                document.body.appendChild(script);
            });

            // Step 3 — open Razorpay popup
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: "INR",
                name: "Shasstore",
                description: "Premium Men's Shirts",
                image: "/logo.png",
                order_id: order.id,
                prefill: {
                    name: form.name,
                    email: form.email,
                    contact: form.phone,
                },
                theme: { color: "#1c1917" },
                handler: async (response: any) => {
                    setPlacingOrder(true);
                    try {
                        const verify = await fetch("/api/verify-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                ...response,
                                customerDetails: form,
                                cartItems: cartItems,
                            }),
                        });
                        const result = await verify.json();

                        if (result.success) {
                            clearCart();
                            router.push("/checkout/success");
                            return;
                        }

                        // Failure: surface the refund status so the customer knows what happened
                        const refundedNote = result.refunded
                            ? " Your payment is being refunded automatically (allow 5-10 days)."
                            : " Please contact support to arrange a refund.";

                        if (result.out_of_stock) {
                            setGeneralError(
                                "Sorry, some items just sold out before your payment cleared." + refundedNote
                            );
                            setTimeout(() => router.push("/cart"), 4000);
                        } else {
                            setGeneralError(
                                (result.error ?? "Payment verification failed.") + refundedNote
                            );
                        }
                    } finally {
                        setPlacingOrder(false);
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => setLoading(false),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error(err);
            setGeneralError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    // Empty cart guard
    if (cartItems.length === 0) {
        return (
            <div className="bg-[#FAFAF8] min-h-screen flex items-center justify-center pt-24">
                <div className="text-center px-8">
                    <p className="text-5xl text-stone-300 font-light mb-6"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        Nothing to checkout.
                    </p>
                    <Link href="/products"
                        className="inline-block bg-stone-900 text-white px-10 py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-stone-700 transition-all duration-300">
                        Shop All Shirts
                    </Link>
                </div>
            </div>
        );
    }

    const inputClass = (field: FormFields) => {
        const hasError = touched[field] && errors[field];
        return `w-full border px-4 py-3 text-sm font-light focus:outline-none bg-white placeholder:text-stone-300 transition-colors ${
            hasError
                ? "border-red-400 text-red-700 focus:border-red-500"
                : "border-stone-200 text-stone-800 focus:border-stone-500"
        }`;
    };

    const fields = [
        { name: "name" as const, label: "Full Name *", type: "text", placeholder: "John Doe" },
        { name: "email" as const, label: "Email Address *", type: "email", placeholder: "you@example.com" },
        { name: "phone" as const, label: "Phone Number *", type: "tel", maxLength: 10, placeholder: "10-digit mobile" },
        { name: "pincode" as const, label: "Pincode *", type: "text", maxLength: 6, placeholder: "6-digit code" },
    ];

    return (
        <div className="bg-[#FAFAF8] min-h-screen pt-20 md:pt-32 pb-12 md:pb-24">
            {/* Placing-order full-screen overlay — shown while verify-payment is in flight */}
            {placingOrder && (
                <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-sm flex items-center justify-center px-6">
                    <div className="text-center max-w-sm">
                        <div className="w-12 h-12 mx-auto mb-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                        <p
                            className="text-2xl md:text-3xl text-stone-900 font-light mb-2"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            Order is placing
                        </p>
                        <p className="text-sm text-stone-500 font-light">
                            Please don&apos;t close or refresh this page — we&apos;re confirming your payment.
                        </p>
                    </div>
                </div>
            )}
            <div className="max-w-5xl mx-auto px-4 md:px-8">

                {/* Header */}
                <div className="mb-12">
                    <p className="text-xs tracking-[0.4em] text-stone-400 uppercase mb-2">Final Step</p>
                    <h1 className="text-3xl md:text-5xl text-stone-900 font-light"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        Checkout
                    </h1>
                </div>

                {/* General error banner */}
                {generalError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {generalError}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* ── Left — Delivery Form ── */}
                    <div className="lg:col-span-2 space-y-6">
                        <form noValidate onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
                            <div className="bg-white border border-stone-100 p-8">
                                <h2 className="text-xl text-stone-900 font-light mb-6"
                                    style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                    Delivery Details
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {fields.map((field) => (
                                        <div key={field.name}>
                                            <label className="text-xs tracking-widest uppercase text-stone-400 block mb-2">
                                                {field.label}
                                            </label>
                                            <input
                                                type={field.type}
                                                name={field.name}
                                                value={form[field.name]}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder={field.placeholder}
                                                maxLength={field.maxLength}
                                                aria-invalid={Boolean(touched[field.name] && errors[field.name])}
                                                className={inputClass(field.name)}
                                            />
                                            {touched[field.name] && errors[field.name] && (
                                                <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>
                                            )}
                                        </div>
                                    ))}

                                    {/* Address — full width */}
                                    <div className="sm:col-span-2">
                                        <label className="text-xs tracking-widest uppercase text-stone-400 block mb-2">
                                            Address *
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="Door no, Street, Area, Landmark"
                                            aria-invalid={Boolean(touched.address && errors.address)}
                                            className={inputClass("address")}
                                        />
                                        {touched.address && errors.address && (
                                            <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                                        )}
                                    </div>

                                    {/* City — full width */}
                                    <div className="sm:col-span-2">
                                        <label className="text-xs tracking-widest uppercase text-stone-400 block mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={form.city}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="e.g. Bangalore"
                                            aria-invalid={Boolean(touched.city && errors.city)}
                                            className={inputClass("city")}
                                        />
                                        {touched.city && errors.city && (
                                            <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Cart Items Summary */}
                        <div className="bg-white border border-stone-100 p-8">
                            <h2 className="text-xl text-stone-900 font-light mb-6"
                                style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                Order Items
                            </h2>
                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 items-center">
                                        <div className="relative w-14 h-16 bg-stone-100 flex-shrink-0 overflow-hidden">
                                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-stone-800 text-sm font-light">{item.name}</p>
                                            <p className="text-stone-400 text-xs">Size: {item.selectedSize} × {item.quantity}</p>
                                        </div>
                                        <p className="text-stone-700 text-sm font-medium">
                                            ₹{(item.price * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Right — Order Summary + Pay Button ── */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-stone-100 p-8 sticky top-28">
                            <h2 className="text-2xl text-stone-900 font-light mb-6"
                                style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                Summary
                            </h2>

                            <div className="space-y-3 text-sm mb-6">
                                <div className="flex justify-between text-stone-500">
                                    <span>Subtotal</span>
                                    <span>₹{totalPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-stone-500">
                                    <span>Delivery</span>
                                    <span className={deliveryCharge === 0 ? "text-emerald-600" : ""}>
                                        {deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-stone-100 pt-5 mb-8 flex justify-between items-center">
                                <span className="text-lg text-stone-900"
                                    style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                    Total
                                </span>
                                <span className="text-lg font-medium text-stone-900">
                                    ₹{grandTotal.toLocaleString()}
                                </span>
                            </div>

                            {/* ── PAY BUTTON ── */}
                            <button
                                type="button"
                                onClick={handlePayment}
                                disabled={loading}
                                className={`w-full py-4 text-xs tracking-[0.3em] uppercase font-medium transition-all duration-300 ${loading
                                        ? "bg-stone-400 text-white cursor-not-allowed"
                                        : "bg-stone-900 text-white hover:bg-stone-700"
                                    }`}
                            >
                                {loading ? "Opening Payment..." : `Pay ₹${grandTotal.toLocaleString()}`}
                            </button>

                            <Link href="/cart"
                                className="block text-center text-xs text-stone-400 hover:text-stone-700 tracking-widest uppercase mt-4 transition-colors">
                                ← Back to Cart
                            </Link>

                            {/* Trust badges */}
                            <div className="mt-6 pt-6 border-t border-stone-100 space-y-2">
                                {[
                                    ["🔒", "100% Secure Payment"],
                                    ["↩️", "14-day easy returns"],
                                    ["🚚", "Free delivery over ₹2,000"],
                                ].map(([icon, text]) => (
                                    <div key={text} className="flex items-center gap-2">
                                        <span className="text-sm">{icon}</span>
                                        <p className="text-xs text-stone-400 font-light">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
