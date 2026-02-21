import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | EIOS",
  description: "Terms of Service for Event Invitation OS",
};

export default function TermsPage() {
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
        <h1 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-4">
          Terms of Service
        </h1>
        <p className="text-stone-500 mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="prose prose-stone max-w-none">
          <p className="text-stone-600 leading-relaxed">
            Please read these Terms of Service carefully before using the Event Invitation OS (EIOS) 
            platform. By accessing or using our service, you agree to be bound by these terms.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">1. Acceptance of Terms</h2>
          <p className="text-stone-600 leading-relaxed">
            By accessing or using the EIOS website, mobile applications, or any other services 
            provided by Event Invitation OS (collectively, the &ldquo;Service&rdquo;), you agree 
            to be bound by these Terms of Service. If you do not agree to these terms, please 
            do not use our Service.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">2. Description of Service</h2>
          <p className="text-stone-600 leading-relaxed">
            EIOS provides an online platform for creating, managing, and sending digital event 
            invitations, tracking RSVPs, managing guest lists, and communicating with event 
            attendees. Our services include:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>Digital invitation creation and customization tools</li>
            <li>Guest list management and import capabilities</li>
            <li>RSVP tracking and response management</li>
            <li>Email and SMS communication features</li>
            <li>Analytics and reporting tools</li>
            <li>Team collaboration features for event planning</li>
          </ul>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">3. User Accounts</h2>
          <p className="text-stone-600 leading-relaxed">
            To access certain features of the Service, you must create an account. You are 
            responsible for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>Providing accurate and complete information during registration</li>
            <li>Maintaining the security of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized access or security breaches</li>
          </ul>
          <p className="text-stone-600 leading-relaxed mt-4">
            We reserve the right to suspend or terminate accounts that provide false information 
            or violate these terms.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">4. Subscription and Payments</h2>
          <p className="text-stone-600 leading-relaxed">
            EIOS offers both free and paid subscription plans. By selecting a paid plan:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>You agree to pay all fees associated with your selected plan</li>
            <li>Subscription fees are billed in advance on a monthly or annual basis</li>
            <li>All payments are non-refundable except as required by law or as explicitly stated</li>
            <li>You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period</li>
            <li>We reserve the right to change pricing with 30 days advance notice</li>
          </ul>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">5. Content and Intellectual Property</h2>
          <p className="text-stone-600 leading-relaxed">
            <strong>Your Content:</strong> You retain ownership of all content you create, upload, 
            or store on the Service, including guest information, event details, and custom 
            invitation designs. By using our Service, you grant EIOS a limited license to use, 
            store, and process your content solely for the purpose of providing and improving 
            our services.
          </p>
          <p className="text-stone-600 leading-relaxed mt-4">
            <strong>Our Intellectual Property:</strong> The EIOS platform, including all software, 
            designs, logos, trademarks, and proprietary technology, is owned by Event Invitation OS 
            and protected by copyright, trademark, and other intellectual property laws. You may 
            not copy, modify, distribute, or create derivative works without our express written 
            permission.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">6. Prohibited Activities</h2>
          <p className="text-stone-600 leading-relaxed">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 text-stone-600">
            <li>Use the Service for any illegal purpose or in violation of any laws</li>
            <li>Send spam, unsolicited communications, or harassing messages</li>
            <li>Impersonate any person or entity or misrepresent your affiliation</li>
            <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
            <li>Interfere with or disrupt the integrity or performance of the Service</li>
            <li>Upload viruses, malware, or other harmful code</li>
            <li>Scrape, data-mine, or use automated methods to access our Service</li>
            <li>Use the Service to send content that is defamatory, obscene, or infringing</li>
          </ul>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">7. Termination</h2>
          <p className="text-stone-600 leading-relaxed">
            We reserve the right to suspend or terminate your access to the Service at any time, 
            with or without cause, and with or without notice. Reasons for termination may include 
            violation of these terms, fraudulent activity, or extended periods of inactivity. 
            Upon termination, your right to use the Service immediately ceases.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">8. Disclaimer of Warranties</h2>
          <p className="text-stone-600 leading-relaxed">
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT 
            WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED 
            BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES 
            OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p className="text-stone-600 leading-relaxed mt-4">
            We do not warrant that the Service will be uninterrupted, timely, secure, or error-free, 
            or that any defects will be corrected.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">9. Limitation of Liability</h2>
          <p className="text-stone-600 leading-relaxed">
            TO THE FULLEST EXTENT PERMITTED BY LAW, EVENT INVITATION OS AND ITS OFFICERS, 
            DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR 
            GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
          </p>
          <p className="text-stone-600 leading-relaxed mt-4">
            Our total liability for any claims arising under these terms shall not exceed the 
            amount you paid to us in the twelve (12) months preceding the claim, or $100, 
            whichever is greater.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">10. Changes to Terms</h2>
          <p className="text-stone-600 leading-relaxed">
            We may modify these Terms of Service at any time. We will notify you of material 
            changes by email or by posting a notice on our website. Your continued use of the 
            Service after such changes constitutes acceptance of the updated terms. If you do 
            not agree to the changes, you should stop using the Service.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">11. Governing Law</h2>
          <p className="text-stone-600 leading-relaxed">
            These Terms of Service shall be governed by and construed in accordance with the laws 
            of the State of Delaware, United States, without regard to its conflict of law 
            provisions. Any disputes arising under these terms shall be resolved exclusively in 
            the state or federal courts located in Delaware.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-10 mb-4">12. Contact Information</h2>
          <p className="text-stone-600 leading-relaxed">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="mt-4 p-6 bg-white rounded-xl border border-stone-200">
            <p className="text-stone-800 font-medium">Event Invitation OS</p>
            <p className="text-stone-600">Email: legal@eios.app</p>
            <p className="text-stone-600">Address: 123 Innovation Drive, Suite 100, Wilmington, DE 19801</p>
          </div>
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
