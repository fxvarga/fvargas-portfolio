import React, {Fragment} from 'react';
import BackToTop from '../../components/backToTop/backToTop';
import Demos from './demos';
import Footer from './footer';
import Header from './header';
import Hero from './hero';
import './style.scss'

const PreviewPage =() => {
    return(
        <Fragment>
           <Header/>
           <Hero/>
           <Demos/>
           <Footer/>
           <BackToTop/>
        </Fragment>
    )
};
export default PreviewPage;
