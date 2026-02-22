import React from "react";

export default function RefundPage() {
  return (
    <div className="min-h-dvh w-full bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 px-4 py-12">
      <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Refund Policy</h1>
      <div className="prose prose-slate text-slate-600">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h3>1. Digital Service Nature</h3>
        <p>
          Virality OS provides an instant digital processing service. Due to the nature of digital goods and services, 
          once the service has been rendered (i.e., the video has been processed and made available for download), 
          it cannot be "returned."
        </p>

        <h3>2. Eligibility for Refunds</h3>
        <p>
          Refunds are generally not provided for successful transactions. However, we will issue a full refund in the following specific cases:
        </p>
        <ul className="list-disc pl-5">
          <li><strong>Technical Failure:</strong> If the payment was successful but the video failed to process due to a server error or technical glitch on our end.</li>
          <li><strong>Double Charge:</strong> If you were charged multiple times for a single transaction.</li>
        </ul>

        <h3>3. Non-Refundable Scenarios</h3>
        <p>
          Refunds will NOT be issued for:
        </p>
        <ul className="list-disc pl-5">
          <li>User error (e.g., uploading the wrong file).</li>
          <li>Change of mind after the service has been delivered.</li>
          <li>Incompatibility with specific, unsupported video formats (though we strive to support standard formats).</li>
        </ul>

        <h3>4. How to Request a Refund</h3>
        <p>
          To request a refund, please email us at <strong>support@viralityos.in</strong> within <strong>3 days</strong> of the transaction. 
          Please include your Transaction ID (from Razorpay) and a brief description of the issue.
        </p>

        <h3>5. Processing Time</h3>
        <p>
          Approved refunds will be processed within 5-7 business days and credited back to the original payment method.
        </p>
      </div>
      </div>
    </div>
  );
}
