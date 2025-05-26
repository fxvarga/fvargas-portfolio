import React, { Fragment } from 'react';
import BackToTop from '../../components/backToTop/backToTop';
import ContactArea from '../../components/ContactArea';
import Hero from '../../components/hero/hero';
import Navbar from '../../components/Navbar/Navbar';
import ServiceSection from '../../components/ServiceSection/ServiceSection';
import { Element } from 'react-scroll'
import Footer from '../../components/footer/Footer';
import About from '../../components/about/about';

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