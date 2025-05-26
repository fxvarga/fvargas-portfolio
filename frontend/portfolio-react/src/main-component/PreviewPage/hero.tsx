import React from "react";
import { Link } from 'react-scroll'

import mouse from './image/mouse-scroll.svg'

const Hero = () => {
    return (
        <section className="static-hero previews" id='home'>
            <div className="hero-container">
                <div className="hero-inner">
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-xl-12 col-lg-12 col-12">
                                <div className="wpo-static-hero-inner">
                                    <div data-swiper-parallax="300" className="slide-title">
                                        <h2><span>Light & Dark,</span></h2>
                                    </div>
                                    <div data-swiper-parallax="400" className="slide-text">
                                        <p></p>
                                    </div>
                                    <div className="clearfix"></div>
                                    <div className="slide-btn-2"> <Link to="demo" spy={true} smooth={true} duration={500}><img src={mouse} alt="" /></Link></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero;
