import { siteConfig } from '../content/site';
import SectionHeader from '../components/SectionHeader';
import Editable from '../components/Editable';

export default function Contact() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <SectionHeader
            label="Contact"
            heading="Let's talk about your next project"
            subheading="I'm always interested in hearing about new opportunities in UX design. Whether you need help with a product redesign, design system, or user research — reach out."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-txt-muted font-body">Email</p>
                <a href={`mailto:${siteConfig.contactEmail}`} className="text-txt font-medium font-body hover:text-primary transition-colors">
                  <Editable path="contact.email">{siteConfig.contactEmail}</Editable>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-txt-muted font-body">Phone</p>
                <a href={`tel:${siteConfig.contactPhone}`} className="text-txt font-medium font-body hover:text-primary transition-colors">
                  <Editable path="contact.phone">{siteConfig.contactPhone}</Editable>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-txt-muted font-body">Location</p>
                <Editable path="contact.location" as="p" className="text-txt font-medium font-body">{siteConfig.location}</Editable>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-txt-muted font-body">LinkedIn</p>
                <a href="https://www.linkedin.com/in/bradearnhardt/" target="_blank" rel="noopener noreferrer" className="text-txt font-medium font-body hover:text-primary transition-colors">
                  linkedin.com/in/bradearnhardt
                </a>
              </div>
            </div>
          </div>

          {/* CTA Card */}
          <div className="bg-surface rounded-lg p-8 text-txt-inverse">
            <Editable path="contact.ctaHeading" as="h3" className="font-heading text-2xl font-bold mb-4">Ready to collaborate?</Editable>
            <Editable path="contact.ctaDescription" as="p" className="text-txt-inverse/70 font-body leading-relaxed mb-6">
              The best way to reach me is by email. I typically respond within 24 hours on business days.
            </Editable>
            <a
              href={`mailto:${siteConfig.contactEmail}?subject=UX%20Design%20Opportunity`}
              className="btn-primary w-full justify-center"
            >
              Send an Email
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <p className="text-txt-inverse/50 text-sm font-body mt-4 text-center">
              or call {siteConfig.contactPhone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
