import Link from "next/link";
import { Calendar, ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | EIOS",
  description: "Privacy Policy for Event Invitation OS",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FDF8F5]">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-serif font-semibold text-stone-900">EIOS</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 lg:py-16">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-[#8B6B5D]" />
          <h1 className="font-serif text-4xl lg:text-5xl text-stone-900">
            Privacy Policy
          </h1>
        </div>
        <p className="text-stone-500 mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="prose prose-stone max-w-none">
          <p className="text-stone-600 leading-relaxed">
            At Event Invitation OS (EIOS), we take your privacy seriously. This Privacy Policy 
            explains how we collect, use, disclose, and safeguard your information when you use 
            our platform and services.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">1. Introduction</h2>
          <p className="text-stone-600 leading-relaxed">
            This Privacy Policy applies to all information collected through our website, 
            mobile applications, and any related services. By using EIOS, you consent to 
            the data practices described in this policy. We are committed to protecting 
            your personal information and being transparent about how we handle your data.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">2. Information We Collect</h2>
          <p className="text-stone-600 leading-relaxed">
            <strong>Personal Information:</strong> We collect information that you provide 
            directly to us, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>Name, email address, and contact information</li>
            <li>Account credentials and profile information</li>
            <li>Payment and billing information (processed securely by our payment partners)</li>
            <li>Guest lists and contact information you upload</li>
            <li>Event details and preferences</li>
            <li>Communications you send through our platform</li>
          </ul>
          <p className="text-stone-600 leading-relaxed mt-4">
            <strong>Usage Data:</strong> We automatically collect information about how you 
            interact with our Service, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>Device information (browser type, operating system, IP address)</li>
            <li>Log data and analytics about your usage patterns</li>
            <li>Actions taken within the platform (pages viewed, features used)</li>
            <li>Date and time stamps of your activities</li>
          </ul>
          <p className="text-stone-600 leading-relaxed mt-4">
            <strong>Cookies and Similar Technologies:</strong> We use cookies and similar 
            tracking technologies to enhance your experience and collect usage data.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">3. How We Use Your Information</h2>
          <p className="text-stone-600 leading-relaxed">We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>Provide, maintain, and improve our Service</li>
            <li>Process transactions and manage your account</li>
            <li>Send invitations and communications on your behalf</li>
            <li>Track RSVPs and manage guest responses</li>
            <li>Communicate with you about your account, updates, and support</li>
            <li>Personalize your experience and provide tailored recommendations</li>
            <li>Analyze usage patterns to improve our platform</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">4. Data Sharing and Disclosure</h2>
          <p className="text-stone-600 leading-relaxed">
            We do not sell your personal information. We may share your information in 
            the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>
              <strong>Service Providers:</strong> With trusted third-party vendors who 
              assist in operating our Service (payment processors, email delivery services, 
              cloud hosting providers), subject to strict confidentiality agreements.
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law, court order, or 
              government regulation, or to protect our rights, property, or safety, or 
              that of our users or others.
            </li>
            <li>
              <strong>Business Transfers:</strong> In connection with a merger, acquisition, 
              or sale of assets, with notice to affected users.
            </li>
            <li>
              <strong>With Your Consent:</strong> When you explicitly authorize us to share 
              your information.
            </li>
          </ul>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">5. Data Security</h2>
          <p className="text-stone-600 leading-relaxed">
            We implement industry-standard security measures to protect your information, 
            including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>256-bit SSL/TLS encryption for data in transit</li>
            <li>AES-256 encryption for data at rest</li>
            <li>Regular security audits and penetration testing</li>
            <li>Access controls and authentication requirements</li>
            <li>Employee training on data protection practices</li>
          </ul>
          <p className="text-stone-600 leading-relaxed mt-4">
            While we strive to use commercially acceptable means to protect your personal 
            information, no method of transmission over the internet is 100% secure. We 
            cannot guarantee absolute security.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">6. Your Rights</h2>
          <p className="text-stone-600 leading-relaxed">
            Depending on your location, you may have the following rights regarding your 
            personal information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>
              <strong>Access:</strong> Request a copy of the personal information we hold about you.
            </li>
            <li>
              <strong>Correction:</strong> Request that we correct inaccurate or incomplete information.
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal information, subject to 
              certain legal exceptions.
            </li>
            <li>
              <strong>Portability:</strong> Request transfer of your data to another service in a 
              structured, machine-readable format.
            </li>
            <li>
              <strong>Objection:</strong> Object to certain processing of your data, including 
              direct marketing.
            </li>
            <li>
              <strong>Restriction:</strong> Request limitation of how we use your information.
            </li>
          </ul>
          <p className="text-stone-600 leading-relaxed mt-4">
            To exercise these rights, please contact us at privacy@eios.app. We will respond 
            to your request within 30 days.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">7. Cookies and Tracking</h2>
          <p className="text-stone-600 leading-relaxed">
            We use cookies and similar technologies to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>Remember your preferences and settings</li>
            <li>Keep you logged in during your session</li>
            <li>Understand how you interact with our Service</li>
            <li>Improve our platform and user experience</li>
            <li>Deliver relevant content and communications</li>
          </ul>
          <p className="text-stone-600 leading-relaxed mt-4">
            You can manage cookie preferences through your browser settings. Note that 
            disabling certain cookies may affect the functionality of our Service.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">8. Data Retention</h2>
          <p className="text-stone-600 leading-relaxed">
            We retain your personal information for as long as necessary to provide our 
            Service, fulfill the purposes outlined in this Privacy Policy, and comply with 
            legal obligations. Specifically:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>Account information: Retained while your account is active</li>
            <li>Event data: Retained according to your plan settings and until you delete it</li>
            <li>Usage logs: Retained for up to 24 months for security and analytics</li>
            <li>Payment records: Retained for 7 years as required by tax laws</li>
          </ul>
          <p className="text-stone-600 leading-relaxed mt-4">
            When you delete your account, we will initiate deletion of your data within 
            30 days, except where retention is required by law.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">9. Children&apos;s Privacy</h2>
          <p className="text-stone-600 leading-relaxed">
            EIOS is not intended for use by children under 13 years of age. We do not 
            knowingly collect personal information from children under 13. If we become 
            aware that we have collected data from a child under 13, we will take steps 
            to delete that information promptly. If you believe we may have collected 
            information from a child under 13, please contact us at privacy@eios.app.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">10. International Transfers</h2>
          <p className="text-stone-600 leading-relaxed">
            EIOS is based in the United States. If you access our Service from outside 
            the United States, your information may be transferred to, stored, and 
            processed in the United States or other countries where our service providers 
            operate. By using our Service, you consent to the transfer of your information 
            to countries that may have different data protection laws than your country 
            of residence.
          </p>
          <p className="text-stone-600 leading-relaxed mt-4">
            For users in the European Economic Area (EEA), United Kingdom, or Switzerland, 
            we implement appropriate safeguards, such as Standard Contractual Clauses, 
            to protect your data during international transfers.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">11. Changes to This Policy</h2>
          <p className="text-stone-600 leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our 
            practices or legal requirements. We will notify you of material changes by 
            email or by posting a prominent notice on our website. The &ldquo;Last updated&rdquo; 
            date at the top of this policy indicates when it was most recently revised. 
            We encourage you to review this policy periodically.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">12. Contact Us</h2>
          <p className="text-stone-600 leading-relaxed">
            If you have any questions, concerns, or requests regarding this Privacy Policy 
            or our data practices, please contact us:
          </p>
          <div className="mt-4 p-6 bg-white rounded-xl border border-stone-200">
            <p className="text-stone-800 font-medium">Event Invitation OS</p>
            <p className="text-stone-600">Email: privacy@eios.app</p>
            <p className="text-stone-600">Address: 123 Innovation Drive, Suite 100, Wilmington, DE 19801</p>
            <p className="text-stone-600">Data Protection Officer: dpo@eios.app</p>
          </div>
          <p className="text-stone-600 leading-relaxed mt-4">
            For users in the European Union, you also have the right to lodge a complaint 
            with your local data protection authority.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif font-semibold text-stone-900">EIOS</span>
            </div>
            <p className="text-sm text-stone-500">
              © {new Date().getFullYear()} Event Invitation OS. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
