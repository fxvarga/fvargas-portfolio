
import React, { Fragment } from 'react';
import { Dialog, Grid, } from '@mui/material'
import './style.css'
import Contact from './contact';
import CustomDialogTitle from '../dialog/CustomDialogTitle';


const ServiceSingle = ({ open, onClose, title, dImg }) => {
  const renderLeadIn = () => {
    return (
      <p>This search platform was designed to deliver fast, intelligent discovery across a vast content catalog. The challenge was balancing performance, accuracy, and user-friendly UI while supporting fuzzy matching and deep filtering at scale — empowering users to quickly find what they need across millions of records.</p>)
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        className="modalWrapper quickview-dialog"
      >
        <CustomDialogTitle id="customized-dialog-title" onClose={onClose}>
          Elastic Search Platform

        </CustomDialogTitle>
        <Grid className="modalBody modal-body">
          <div className="tp-service-single-area">
            <div className="container">
              <div className="row">
                <div className="col-lg-12 col-12 ">
                  <div className="tp-service-single-wrap">
                    <div className="tp-service-single-main-img mt-2">
                      <img src={dImg} alt="" />
                    </div>

                    <div className="tp-service-single-item p-3">
                      <div className="tp-service-single-title">
                        <h3>{title}</h3>
                      </div>
                      <p>{renderLeadIn()}</p>
                      {/* <div className="row mt-4">
                                                <div className="col-md-6 col-sm-6 col-12">
                                                    <div className="tp-p-details-img">
                                                        <img src={sImg1} alt="" />
                                                    </div>
                                                </div>
                                                <div className="col-md-6 col-sm-6 col-12">
                                                    <div className="tp-p-details-img">
                                                        <img src={sImg2} alt="" />
                                                    </div>
                                                </div>
                                            </div> */}
                    </div>
                    <div className="tp-service-single-item list-widget p-3">
                      <div className="tp-service-single-title">
                        <h3>Technologies used</h3>
                      </div>
                      <ul>
                        <li>Elasticsearch</li>
                        <li>JavaScript</li>
                        <li>Modular Component Design</li>
                        <li>PHP Backend Services</li>
                        <li>Responsive UI Architecture</li>
                        <li>Meteor.js (live query updates)</li>
                        <li>MySQL</li>   </ul>
                    </div>
                    <div className="tp-service-single-item p-3">
                      <div className="tp-service-single-title">
                        <h3>Approach</h3>
                      </div>
                      <p><b>Fuzzy Search Integration:</b> Implemented Elasticsearch with configurable fuzzy matching, stemming, and synonym support to improve relevance and recall for end users searching events, venues, and content.</p>

                      <p><b>Componentized Search UI:</b> Built a modular JavaScript-based UI that allowed for pluggable search filters, sorting options, and live suggestions — all optimized for responsiveness and accessibility.</p>

                      <p><b>Real-Time Result Updates:</b> Integrated with Meteor.js to deliver live-updating results as users typed, applied filters, or interacted with the page — improving perceived speed and interactivity.</p>

                      <p><b>Schema-Driven Backend:</b> Designed a flexible search indexing strategy tied to the CMS’s dynamic schema engine, ensuring new content types were automatically searchable with minimal developer effort.</p>

                      <p><b>Scalability & Performance:</b> Tuned Elasticsearch queries and caching layers to handle millions of concurrent requests with low latency, ensuring a smooth discovery experience even during high-traffic events.</p>
                    </div>

                    <div className="tp-service-single-item">
                      <div className="tp-service-contact-area">
                        <div className="tp-contact-title">
                          <h2>Have project in mind? Let's discuss</h2>
                          <p>Get in touch with us to see how we can help you with your project</p>
                        </div>
                        <div className="tp-contact-form-area">
                          <Contact />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Grid>
      </Dialog>
    </>
  );
}
export default ServiceSingle


