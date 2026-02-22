import React from "react";

export default function CancellationPage() {
  return (
    <div className="min-h-dvh w-full bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 px-4 py-12">
      <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Cancellation Policy</h1>
      <div className="prose prose-slate text-slate-600">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h3>1. Transaction Cancellation</h3>
        <p>
          Our service operates on an instant, pay-per-use basis. You may cancel the transaction at any point 
          <strong> before</strong> the payment is successfully captured by Razorpay.
        </p>

        <h3>2. Post-Payment Cancellation</h3>
        <p>
          Once the payment has been processed and the service (video processing) has commenced or completed, 
          the order cannot be cancelled. This is due to the immediate consumption of server resources and delivery of the digital product.
        </p>

        <h3>3. Failed Transactions</h3>
        <p>
          If a transaction fails or is cancelled by the payment gateway before completion, no funds will be deducted from your account. 
          If funds are deducted in error for a failed transaction, they will be automatically reversed by your bank 
          within their standard turnaround time (typically 3-5 business days).
        </p>

        <h3>4. Contact Us</h3>
        <p>
          For any issues regarding cancellations or failed payments, please reach out to us immediately at support@viralityos.in.
        </p>
      </div>
      </div>
    </div>
  );
}
