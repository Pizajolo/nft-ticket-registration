'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import fs from 'fs';
import path from 'path';

export default function PrivacyPage() {
  const router = useRouter();
  const [markdownContent, setMarkdownContent] = React.useState<string>('');

  React.useEffect(() => {
    // In a real application, you would fetch this from an API or static file
    // For now, we'll import it directly
    const loadMarkdown = async () => {
      try {
        const response = await fetch('/content/privacy-policy.md');
        const text = await response.text();
        setMarkdownContent(text);
      } catch (error) {
        console.error('Failed to load privacy policy:', error);
        // Fallback content
        setMarkdownContent(`
# Privacy Policy

**Last updated: September 2025**

## Introduction

This Privacy Policy describes how **THETA EuroCon NFT Registration** ("we," "our," or "us"), organized by **OpenTheta AG**, collects, uses, and protects your information when you use our NFT ticket registration platform for the THETA EuroCon conference.

## Information We Collect

### Personal Information
- **Name**: First and last name for ticket registration
- **Email Address**: For communication and ticket delivery
- **Wallet Address**: Your blockchain wallet address for NFT verification
- **Registration Data**: Information related to your NFT ticket registration

### Technical Information
- **IP Address**: For security and analytics purposes
- **Browser Information**: Device type, browser version, and operating system
- **Usage Data**: How you interact with our platform
- **Session Data**: Authentication tokens and session information

## How We Use Your Information

We use the collected information to:

1. **Verify NFT Ownership**: Confirm your ownership of eligible NFTs
2. **Process Registrations**: Create and manage your event tickets
3. **Generate QR Codes**: Create unique QR codes for event entry
4. **Communicate**: Send important updates about the event
5. **Security**: Prevent fraud and ensure platform security
6. **Analytics**: Improve our platform and user experience

## Information Sharing

We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:

- **Event Organizers**: Share necessary information for event management
- **Legal Requirements**: When required by law or legal process
- **Security**: To protect our platform and users from fraud or abuse
- **Consent**: When you explicitly consent to sharing

## Data Security

We implement appropriate security measures to protect your information:

- **Encryption**: Data is encrypted in transit and at rest
- **Access Controls**: Limited access to personal information
- **Regular Audits**: Security assessments and updates
- **Secure Storage**: Protected database and file storage

## Data Retention

We retain your information for the following periods:

- **Registration Data**: Until the event concludes and post-event activities are complete
- **Technical Data**: Up to 2 years for security and analytics purposes
- **Legal Requirements**: As required by applicable laws

## Your Rights

You have the right to:

- **Access**: Request a copy of your personal information
- **Correction**: Update or correct your information
- **Deletion**: Request deletion of your personal information
- **Portability**: Export your data in a machine-readable format
- **Objection**: Object to certain processing activities

## Cookies and Tracking

We use cookies and similar technologies to:

- **Authentication**: Maintain your login session
- **Preferences**: Remember your settings and preferences
- **Analytics**: Understand how you use our platform
- **Security**: Protect against fraud and abuse

You can control cookie settings through your browser preferences.

## Third-Party Services

Our platform may integrate with third-party services:

- **Blockchain Networks**: For NFT verification
- **Wallet Providers**: For authentication
- **Analytics Services**: For platform improvement
- **Email Services**: For communication

These services have their own privacy policies and practices.

## International Transfers

Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.

## Children's Privacy

Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any material changes by:

- **Email**: Sending notice to your registered email address
- **Platform Notice**: Displaying a notice on our platform
- **Updated Date**: Updating the "Last updated" date at the top

## Contact Us

If you have questions about this Privacy Policy or our data practices, please contact us:

- **Email**: contract@theta-euro.com
- **Organizer**: OpenTheta AG
- **Address**: Sihlbruggstrasse 140, 6340 Baar, Switzerland

## Compliance

This Privacy Policy complies with applicable data protection laws, including:

- **GDPR**: General Data Protection Regulation (EU)
- **CCPA**: California Consumer Privacy Act (US)
- **PIPEDA**: Personal Information Protection and Electronic Documents Act (Canada)

---

*This Privacy Policy is effective as of the date listed above and will remain in effect except with respect to any changes in its provisions in the future.*`);
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
              <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
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
