import React from 'react';
import BackToTop from '../../../shared/components/BackToTop';
import ContactArea from '../contact/ContactArea';
import Hero from '../hero/Hero';
import Navbar from '../navigation/Navbar';
import ServiceSection from '../services/ServiceSection';
import { Element } from 'react-scroll';
import Footer from '../navigation/Footer';
import About from '../about/About';

const HomePage = () => {
  return (
    <>
      <Navbar />
      <Element name='home'>
        <Hero />
      </Element>
      <Element name='about'>
        <About />
      </Element>
      <Element name='featured-work'>
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
