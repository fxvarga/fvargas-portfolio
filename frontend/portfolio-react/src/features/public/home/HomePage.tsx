import React, { useEffect } from 'react';
import { useLocation } from 'react-router';
import { scroller } from 'react-scroll';
import BackToTop from '../../../shared/components/BackToTop';
import ContactArea from '../contact/ContactArea';
import Hero from '../hero/Hero';
import Navbar from '../navigation/Navbar';
import ServiceSection from '../services/ServiceSection';
import { Element } from 'react-scroll';
import Footer from '../navigation/Footer';
import About from '../about/About';

const HomePage = () => {
  const location = useLocation();

  useEffect(() => {
    // Handle hash-based scrolling for search results
    if (location.hash) {
      const hash = location.hash.substring(1); // Remove the # prefix
      
      // First try react-scroll Element names (for main sections)
      const reactScrollNames = ['home', 'about', 'services', 'contact'];
      if (reactScrollNames.includes(hash)) {
        scroller.scrollTo(hash, {
          duration: 500,
          smooth: true,
          offset: -80,
        });
      } else {
        // For service items with id attributes (e.g., service-1, service-2)
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <>
      <Navbar />
      <Element name='home'>
        <Hero />
      </Element>
      <Element name='about'>
        <About />
      </Element>
      <Element name='services'>
        <ServiceSection />
      </Element>
      <Element name='contact'>
        <ContactArea />
      </Element>
      <Footer />
      <BackToTop />
    </>
  )
};
export default HomePage;
