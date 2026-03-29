import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/sections/HeroSection';
import ProblemSection from '../components/sections/ProblemSection';
import SolutionSection from '../components/sections/SolutionSection';
import ServicesSection from '../components/sections/ServicesSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import TestimonialsSection from '../components/sections/TestimonialsSection';
import AboutSection from '../components/sections/AboutSection';
import LeadCaptureSection from '../components/sections/LeadCaptureSection';
import CTASection from '../components/sections/CTASection';
import type { CMSContent } from '../cms';

interface HomeProps {
  content: CMSContent;
}

export default function Home({ content }: HomeProps) {
  return (
    <div className="min-h-screen">
      <Navbar siteConfig={content.siteConfig} navigation={content.navigation} />
      <HeroSection hero={content.hero} />
      <ProblemSection problem={content.problem} />
      <SolutionSection solution={content.solution} />
      <ServicesSection services={content.services} />
      <HowItWorksSection howItWorks={content.howItWorks} />
      <TestimonialsSection testimonials={content.testimonials} />
      <AboutSection about={content.about} />
      <LeadCaptureSection leadCapture={content.leadCapture} />
      <CTASection cta={content.cta} />
      <Footer siteConfig={content.siteConfig} footer={content.footer} />
    </div>
  );
}
