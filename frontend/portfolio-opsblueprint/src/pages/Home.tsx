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

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ServicesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <AboutSection />
      <LeadCaptureSection />
      <CTASection />
      <Footer />
    </div>
  );
}