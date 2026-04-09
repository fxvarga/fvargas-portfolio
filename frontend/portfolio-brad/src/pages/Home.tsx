import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/sections/HeroSection';
import AboutSection from '../components/sections/AboutSection';
import ResumeSection from '../components/sections/ResumeSection';
import ServicesSection from '../components/sections/ServicesSection';
import PortfolioSection from '../components/sections/PortfolioSection';
import StatsSection from '../components/sections/StatsSection';
import ContactSection from '../components/sections/ContactSection';
import BlogSection from '../components/sections/BlogSection';
import type { CMSContent } from '../cms';

interface HomeProps {
  content: CMSContent;
}

export default function Home({ content }: HomeProps) {
  return (
    <>
      <Header siteConfig={content.siteConfig} navigation={content.navigation} />
      <main className="min-h-screen">
        <HeroSection hero={content.hero} />
        <AboutSection about={content.about} />
        <ResumeSection resume={content.resume} />
        <ServicesSection services={content.services} />
        <PortfolioSection portfolio={content.portfolio} />
        <StatsSection stats={content.stats} />
        <ContactSection contact={content.contact} />
        <BlogSection blogPosts={content.blogPosts} />
      </main>
      <Footer siteConfig={content.siteConfig} footer={content.footer} />
    </>
  );
}
