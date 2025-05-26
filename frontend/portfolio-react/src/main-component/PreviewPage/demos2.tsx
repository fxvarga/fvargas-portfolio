import React from "react";
import demo1 from './image/demo/4.png'
import demo2 from './image/demo/5.png'
import demo3 from './image/demo/6.png'
import { Link } from 'react-router'

const Demos2 = () => {
  return (
    <section className="wpo-demo-section  s2  pb-0 section-padding" id="demo2">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col col-lg-6">
            <div className="wpo-section-title">
              <h2>Unique Home Pages Light</h2>
              <p>Unique React Template for the Creative, Personal Portfolio</p>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col col-xs-12">
            <div className="wpo-demo-grids clearfix">
              <div className="grid" >
                <div className="inner">
                  <a href="https://elito-react-light.wpocean.com/" target="_blank"><img src={demo1} alt="" /></a>
                </div>
                <h3>Home Page default</h3>
              </div>
              <div className="grid" >
                <div className="inner">
                  <a href="https://elito-react-light.wpocean.com/home2" target="_blank"><img src={demo2} alt="" /></a>
                </div>
                <h3>Home Style 2</h3>
              </div>
              <div className="grid" >
                <div className="inner">
                  <a href="https://elito-react-light.wpocean.com/home3" target="_blank"><img src={demo3} alt="" /></a>
                </div>
                <h3>Home Style 3</h3>
              </div>
            </div>
          </div>
          <div className="other-demo">
            <div className="other-demo-ball">
              <h3>Other Demo</h3>
              <span>Coming Soon..</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Demos2;
