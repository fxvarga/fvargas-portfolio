
import React, { Fragment } from 'react';
import { Dialog, Grid, } from '@mui/material'
import './style.css'
import Contact from './contact';
import CustomDialogTitle from '../dialog/CustomDialogTitle';


const ServiceSingle = ({ open, onClose, title, dImg }) => {

  const renderLeadIn = () => {
    return (
      <p>This platform was designed to support scalable, schema-driven content delivery across hundreds of client websites in the entertainment industry. Built with reusability, configurability, and autonomy in mind, it empowered marketing teams to manage complex content structures with no engineering support — while maintaining brand consistency and performance at scale.</p>
    )
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        className="modalWrapper quickview-dialog"
      >
        <CustomDialogTitle id="customized-dialog-title" onClose={onClose}>
          Content Management Systems

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
                        <li>PHP</li>
                        <li>Doctrine ORM</li>
                        <li>Custom Code Generation</li>
                        <li>Elasticsearch</li>
                        <li>JavaScript (Vanilla + jQuery)</li>
                        <li>Responsive Grid Layouts</li>
                        <li>Drag-and-Drop UI Components</li>
                      </ul>
                    </div>
                    <div className="tp-service-single-item p-3">
                      <div className="tp-service-single-title">
                        <h3>Approach</h3>
                      </div>
                      <p><b>Dynamic Schema-Driven Architecture:</b> Developed a content modeling system using PHP and Doctrine ORM with code generation, enabling admin-configurable entities and attributes to power varied website structures with no hardcoding required.</p>

                      <p><b>Reusable Templates & Layouts:</b> Created customizable, reusable theme templates allowing rapid deployment of new client sites while ensuring brand alignment and UI consistency.</p>

                      <p><b>Real-Time Search Integration:</b> Built a modular search component using Elasticsearch with fuzzy-matching logic to support quick and flexible content discovery across millions of events, venues, and categories.</p>

                      <p><b>DIY Drag-and-Drop Homepage Editor:</b> Designed an intuitive UI for non-technical content managers to visually compose homepages with drag-and-drop tiles, including live previews and responsive layout options.</p>

                      <p><b>Performance & Scalability:</b> Optimized for high concurrency and minimal page load times using database indexing, front-end caching, and lazy content hydration patterns to support millions of monthly users.</p>
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


