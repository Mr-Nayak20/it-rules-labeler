import React from "react";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh w-full bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 px-4 py-12">
      <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <div className="prose prose-slate text-slate-600">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h3>1. Data Collection</h3>
        <p>
          We collect minimal personal information necessary to process your transaction and deliver the service. 
          This includes your email address for sending the processed file or receipt.
        </p>

        <h3>2. Video Processing & Storage</h3>
        <p>
          <strong>We do not store your videos.</strong> Your video files are processed in real-time. 
          Specifically, with our client-side technology, the video processing happens directly in your browser, 
          meaning the file content never leaves your device. If any server-side processing is required, 
          files are immediately deleted after processing is complete.
        </p>

        <h3>3. Payment Information</h3>
        <p>
          All payment transactions are processed through Razorpay. We do not store or have access to your full credit card number 
          or other sensitive payment details.
        </p>

        <h3>4. Cookies</h3>
        <p>
          We use essential cookies to ensure the proper functioning of our website and to facilitate the payment process.
        </p>

        <h3>5. Data Sharing</h3>
        <p>
          We do not sell, trade, or rent your personal identification information to others. 
          We may share generic aggregated demographic information not linked to any personal identification information.
        </p>

        <h3>6. Contact Us</h3>
        <p>
          If you have any questions about this Privacy Policy, please contact us at support@viralityos.in.
        </p>
      </div>
      </div>
    </div>
  );
}
