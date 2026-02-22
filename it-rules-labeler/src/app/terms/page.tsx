import React from "react";

export default function TermsPage() {
  return (
    <div className="min-h-dvh w-full bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 px-4 py-12">
      <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Terms and Conditions</h1>
      <div className="prose prose-slate text-slate-600">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h3>1. Introduction</h3>
        <p>
          Welcome to Virality OS ("we," "our," or "us"). By accessing or using our website and services, 
          you agree to be bound by these Terms and Conditions.
        </p>

        <h3>2. Services</h3>
        <p>
          We provide a digital service that processes video files to inject C2PA metadata for compliance purposes. 
          The service is provided "as is" and is intended for content creators seeking to label their AI-generated content.
        </p>

        <h3>3. User Responsibilities</h3>
        <p>
          You are responsible for the content of the videos you upload. You represent and warrant that you own the rights 
          to the content or have the necessary permissions to use it. You agree not to upload illegal, harmful, or prohibited content.
        </p>

        <h3>4. Payment</h3>
        <p>
          Our service is a one-time pay-per-use model. The fee is ₹99 per video processed. 
          Payments are processed securely via Razorpay.
        </p>

        <h3>5. Limitation of Liability</h3>
        <p>
          To the fullest extent permitted by law, Virality OS shall not be liable for any indirect, incidental, 
          special, consequential, or punitive damages, or any loss of profits or revenues.
        </p>

        <h3>6. Changes to Terms</h3>
        <p>
          We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of the new terms.
        </p>

        <h3>7. Contact Us</h3>
        <p>
          If you have any questions about these Terms, please contact us at support@viralityos.in.
        </p>
      </div>
      </div>
    </div>
  );
}
