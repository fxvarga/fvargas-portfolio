
import React, { Fragment } from 'react';
import { Dialog, Grid, } from '@mui/material'
import './style.css'
import Contact from './contact';
import CustomDialogTitle from '../dialog/CustomDialogTitle';


const ServiceSingle = ({ open, onClose, title, dImg }) => {

  const renderLeadIn = () => {
    return (
      <p>The AI Workflow Orchestration platform is a distributed automation system designed to transform natural-language process documentation into executable workflows. This project was born from the challenge of democratizing automation — making it accessible to non-technical users while maintaining the power and precision required for complex enterprise operations. By combining AI reasoning, modular skill execution, and a real-time, visual interface, the system empowers teams to automate at scale with confidence and clarity.</p>
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
          AI Workflow
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
                        <li>Frontend: React, TypeScript, React Flow, Fluent UI, Vite, pnpm</li>
                        <li>Backend: .NET Core Orchestrator, Azure Functions, Service Bus, SignalR</li>
                        <li>Automation Layer: Distributed system in Python and .NET modular skill libraries</li>
                        <li>AI: Azure OpenAI, Semantic Kernel</li>
                        <li>DevOps & Infra: Azure DevOps, Application Insights, Feature Flagging, CI/CD Pipelines</li>
                      </ul>
                    </div>
                    <div className="tp-service-single-item p-3">
                      <div className="tp-service-single-title">
                        <h3>Approach</h3>
                      </div>
                      <p><b>Human-to-AI Translation</b>:
                        We used Azure OpenAI and Semantic Kernel to interpret structured process documents, converting them into standardized JSON configurations. This eliminated the traditional gap between documentation and execution.
                      </p>
                      <p><b>Visual Orchestration Interface</b>:

                        Built with React and React Flow, the drag-and-drop editor allows users to create and edit workflows visually. SignalR enabled real-time collaboration and live validation as users modified flows.

                      </p>
                      <p>
                        <b>Distributed Skill Execution</b>:
                        The orchestrator, written in .NET, dynamically invoked modular “skills” — reusable units of work in either Python or .NET. This architecture supports retries, branching, and external API integration, making it extensible and resilient.
                      </p>
                      <p><b>
                        DevEx-First Engineering</b>:

                        Developer experience was core to our platform. We implemented hot-reload tooling, strict type-safety, and component isolation to allow fast iteration and confident deployment. CI/CD pipelines and feature flags ensured safe, zero-downtime rollouts.
                      </p>
                      <p>
                        <b>Secure, Scalable, Observable</b>:
                        With built-in telemetry, structured logging, and user-driven permissions, the system was production-ready from the start. Teams could monitor executions, troubleshoot failures, and audit outcomes — all from within the UI.</p>
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


