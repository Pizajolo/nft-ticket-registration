'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function TermsPage() {
  const router = useRouter();
  const [markdownContent, setMarkdownContent] = React.useState<string>('');

  React.useEffect(() => {
    // In a real application, you would fetch this from an API or static file
    // For now, we'll import it directly
    const loadMarkdown = async () => {
      try {
        const response = await fetch('/content/terms-of-service.md');
        const text = await response.text();
        setMarkdownContent(text);
      } catch (error) {
        console.error('Failed to load terms of service:', error);
        // Fallback content
        setMarkdownContent(`
#Terms of Service

**Last updated: September 2025**

## Agreement to Terms

By accessing and using the **THETA EuroCon NFT Registration** platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.

## Description of Service

THETA EuroCon NFT Registration is a platform that allows users to:

- Register for events using eligible NFTs as tickets
- Verify NFT ownership on the blockchain
- Generate QR codes for event entry
- Manage event registrations and tickets

## Eligibility

To use our Service, you must:

- Be at least 18 years old (or the age of majority in your jurisdiction)
- Own eligible NFTs for the event
- Provide accurate and complete information
- Comply with all applicable laws and regulations

## User Responsibilities

### Accurate Information
You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.

### NFT Ownership
You represent and warrant that:
- You are the rightful owner of any NFTs used for registration
- You have the legal right to use such NFTs for event registration
- Your use of NFTs does not violate any third-party rights

### Prohibited Activities
You agree not to:
- Use the Service for any unlawful purpose
- Attempt to gain unauthorized access to the Service
- Interfere with or disrupt the Service
- Use automated systems to access the Service
- Share or transfer your registration to others without authorization
- Create multiple accounts to circumvent restrictions

## Registration Process

### NFT Verification
- We verify NFT ownership through blockchain technology
- Only eligible NFTs can be used for registration
- Verification is subject to blockchain network conditions

### Ticket Generation
- Upon successful registration, a unique QR code is generated
- QR codes are non-transferable and tied to your identity
- Tickets are valid only for the specific event and date

### Registration Limits
- Each eligible NFT can only be registered once per event
- Users may register multiple NFTs if they own multiple eligible tokens
- Registration is subject to event capacity limits

## Event Terms

### Event Access
- Valid QR code and matching identification required for entry
- Event organizers reserve the right to refuse entry
- Lost or stolen tickets may not be replaced

### Event Changes
- Event details may change due to circumstances beyond our control
- We will notify registered users of significant changes
- Refunds are subject to the event organizer's refund policy

### Conduct
- Attendees must comply with event venue rules and regulations
- Disruptive behavior may result in removal from the event
- Event organizers reserve the right to remove attendees at their discretion

## Intellectual Property

### Our Rights
- The Service and its content are protected by intellectual property laws
- You may not copy, modify, or distribute our content without permission
- Our trademarks and logos are our exclusive property

### Your Content
- You retain ownership of your NFTs and personal information
- You grant us a limited license to use your information for Service provision
- You are responsible for ensuring you have rights to any content you provide

## Privacy and Data Protection

Your privacy is important to us. Our collection and use of personal information is governed by our **Privacy Policy**, which is incorporated into these Terms by reference.

## Disclaimers and Limitations

### Service Availability
- The Service is provided "as is" without warranties of any kind
- We do not guarantee uninterrupted or error-free service
- Service availability may be affected by blockchain network conditions

### Limitation of Liability
To the maximum extent permitted by law:
- We are not liable for any indirect, incidental, or consequential damages
- Our total liability is limited to the amount you paid for the Service
- We are not responsible for third-party actions or blockchain network issues

### Blockchain Risks
- Blockchain transactions are irreversible
- Network fees and transaction times are beyond our control
- Smart contract interactions carry inherent risks

## Indemnification

You agree to indemnify and hold harmless **THETA EuroCon NFT Registration**, **OpenTheta AG**, and their affiliates from any claims, damages, or expenses arising from:
- Your use of the Service
- Your violation of these Terms
- Your violation of any third-party rights
- Your violation of applicable laws

## Termination

### By You
You may stop using the Service at any time. However, completed registrations remain valid according to these Terms.

### By Us
We may suspend or terminate your access to the Service if you:
- Violate these Terms
- Engage in fraudulent or illegal activities
- Pose a security risk to the Service or other users

## Dispute Resolution

### Governing Law
These Terms are governed by the laws of **Switzerland**, without regard to conflict of law principles.

### Dispute Resolution Process
1. **Informal Resolution**: We encourage resolving disputes through direct communication
2. **Mediation**: If informal resolution fails, disputes may be resolved through mediation
3. **Arbitration**: Binding arbitration may be used for unresolved disputes
4. **Class Action Waiver**: You waive the right to participate in class action lawsuits

## Changes to Terms

We may modify these Terms from time to time. We will notify users of material changes by:

- **Email**: Sending notice to your registered email address
- **Platform Notice**: Displaying a notice on our platform
- **Updated Date**: Updating the "Last updated" date at the top

Continued use of the Service after changes constitutes acceptance of the new Terms.

## Severability

If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.

## Entire Agreement

These Terms, together with our Privacy Policy, constitute the entire agreement between you and **THETA EuroCon NFT Registration** regarding the Service.

## Contact Information

For questions about these Terms, please contact us:

- **Email**: contract@theta-euro.com
- **Organizer**: OpenTheta AG
- **Address**: Sihlbruggstrasse 140, 6340 Baar, Switzerland

## Acknowledgment

By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.

---

*These Terms of Service are effective as of the date listed above and will remain in effect until modified or terminated.*
`);
      }
    };

    loadMarkdown();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.back()} 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Terms of Service</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children, ...props }: any) => (
                  <h1 className="text-3xl font-bold text-gray-900 mb-6" {...props}>{children}</h1>
                ),
                h2: ({ children, ...props }: any) => (
                  <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4" {...props}>{children}</h2>
                ),
                h3: ({ children, ...props }: any) => (
                  <h3 className="text-xl font-medium text-gray-700 mt-6 mb-3" {...props}>{children}</h3>
                ),
                p: ({ children, ...props }: any) => (
                  <p className="text-gray-600 mb-4 leading-relaxed" {...props}>{children}</p>
                ),
                ul: ({ children, ...props }: any) => (
                  <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2" {...props}>{children}</ul>
                ),
                ol: ({ children, ...props }: any) => (
                  <ol className="list-decimal list-inside text-gray-600 mb-4 space-y-2" {...props}>{children}</ol>
                ),
                li: ({ children, ...props }: any) => (
                  <li className="text-gray-600" {...props}>{children}</li>
                ),
                strong: ({ children, ...props }: any) => (
                  <strong className="font-semibold text-gray-800" {...props}>{children}</strong>
                ),
                em: ({ children, ...props }: any) => (
                  <em className="italic text-gray-700" {...props}>{children}</em>
                ),
                hr: (props: any) => (
                  <hr className="my-8 border-gray-200" {...props} />
                ),
                blockquote: ({ children, ...props }: any) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...props}>
                    {children}
                  </blockquote>
                 ),
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
