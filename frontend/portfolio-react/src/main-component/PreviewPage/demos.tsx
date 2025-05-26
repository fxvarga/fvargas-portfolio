import React from "react";
import demo1 from './image/demo/1.png'
import demo2 from './image/demo/2.png'
import { Link } from 'react-router'

const Demos = () => {
  return (
    <section className="wpo-demo-section section-padding pb-0" id="demo">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col col-lg-6">
            <div className="wpo-section-title">
              <h2>Unique Design</h2>
              <p>Unique React Template for the Creative, Personal Portfolio</p>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col col-xs-12">
            <div className="wpo-demo-grids clearfix">
              <div className="grid" >
                <div className="inner">
                  <Link to="/" target="_blank"><img src={demo1} alt="" /></Link>
                </div>
                <h3>Home Page default</h3>
              </div>
              <div className="grid" >
                <div className="inner">
                  <Link to="/home2" target="_blank"><img src={demo2} alt="" /></Link>
                </div>
                <h3>Home Style 2</h3>
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

export default Demos;
