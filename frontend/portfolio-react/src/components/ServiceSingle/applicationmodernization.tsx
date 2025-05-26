
import React, { Fragment } from 'react';
import { Dialog, Grid, } from '@mui/material'
import './style.css'
import Contact from './contact';
import CustomDialogTitle from '../dialog/CustomDialogTitle';


const ServiceSingle = ({ open, onClose, title, dImg }) => {
  // Define the styles with proper typing


  const renderLeadIn = () => {
    return (
      <p>The Financial Dashboard Applications project aimed to centralize critical financial data from siloed systems into a single, intuitive interface. This initiative tackled the complexity of integrating disparate backends, filters, and authorization models—creating a seamless, micro-frontend experience where finance leads could make informed decisions with consolidated data at their fingertips. By leveraging a micro-frontend architecture, we ensured that each component could be developed, deployed, and scaled independently, allowing for rapid iteration and enhanced user experience.</p>
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
          Financial Dashboard Applications
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
                        <li>React</li>
                        <li>TypeScript</li>
                        <li>GraphQL</li>
                        <li>CQRS</li>
                        <li>Fluent UI</li>
                        <li>Storybook</li>
                        <li>Webpack Module Federation</li>
                        <li>CI/CD pipelines</li>
                        <li>Role-Based Access Control (RBAC)</li>
                      </ul>
                    </div>
                    <div className="tp-service-single-item p-3">
                      <div className="tp-service-single-title">
                        <h3>Approach</h3>
                      </div>

                      <p><b>Micro-Frontend Architecture:</b> Employed Webpack Module Federation to allow distributed teams to independently build and deploy dashboard tiles. Each tile followed a shared contract, enabling plug-and-play functionality across five platforms.</p>

                      <p><b>Reusable Tile Components & Tooling:</b> Developed a React + Storybook component library with build tools that empowered other teams to easily create and deploy visual tiles. This included shared filtering logic and responsive layout scaffolding.</p>

                      <p><b>Real-Time Filtering & Navigation:</b> Enabled cross-tile filtering so users could drill into business dimensions and instantly see the effect across all dashboards—no reloads or manual refreshes required.</p>

                      <p><b>Scalable Developer Experience:</b> Delivered tooling and integration scaffolding that accelerated onboarding and ensured consistency. Automated checks and visual tests maintained performance and quality across the dashboard ecosystem.</p>
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


