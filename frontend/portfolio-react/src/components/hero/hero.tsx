import React, { useState } from "react";
import { NavLink } from 'react-router'
import himg from '../../images/slider/fernando-portfolio-hero.png'
import { Link } from 'react-scroll'
import { useDevMode } from '../../main-component/State/DevModeProvider';
import CustomDialog from "../dialog/InsightsDialog";
import { useLazyQuery } from "@apollo/client";
import { remixImage } from "../../api/insightsApi";
import { CircularProgress } from "@mui/material";

const Hero = () => {
  const { devMode } = useDevMode();
  const [currentImage, setCurrentImage] = useState(himg);
  const [isOriginalImage, setIsOriginalImage] = useState(true);
  const [remixImageQuery, { error, loading }] = useLazyQuery(remixImage, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.generateHeroImage) {
        // Set the new image from the base64 data URL
        setCurrentImage(data.generateHeroImage);
        setIsOriginalImage(false);
      }
    }
  });

  const handleRemixImage = () => {
    remixImageQuery({
      variables: {
        prompt: "Can you take my image, upscale it, put a black background, and cartoonify it?"
      }
    });
  };


  return (
    <section className="tp-hero-section-1">
      <div className="container">
        <div className="row">
          <div className="col col-xs-7 col-lg-7">
            <div className="tp-hero-section-text">
              <div className="tp-hero-title">
                <h2>Senior Full-Stack Engineer</h2>
              </div>
              <div className="tp-hero-sub">
                <p>Fernando Vargas</p>
              </div>
              <div className="btns">
                <Link activeClass="active" to="contact" spy={true} smooth={true} duration={500} offset={-95} className="theme-btn">Contact Me</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="right-vec">
        {devMode && (
          <div className="assistant-button" style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center'
          }}>
            <CustomDialog title="Leveraging GenAI for Image Enhancement">
              <p>
                This section reveals how the hero image was created using generative AI tools I integrated into my workflow.
              </p>
              <p>
                Prompt used: "Can you take my image, upscale it, put a black background, and cartoonify it?"
              </p>
              <p>
                I used an AI-powered image enhancement pipeline that supports real-time experimentation for visual identity and branding. The result is a cohesive, dark-themed vector portrait styled to match the site's design system.
              </p>

              <div style={{ color: 'white', marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px' }}>
                    <CircularProgress size={24} style={{ marginRight: '10px' }} />
                    <span>Generating new portrait...</span>
                  </div>
                ) : (
                  <>
                    <button
                      className="theme-btn"
                      onClick={handleRemixImage}
                      disabled={loading || !isOriginalImage}
                      style={{
                        opacity: loading || !isOriginalImage ? 0.7 : 1,
                        cursor: loading || !isOriginalImage ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Remix Image
                    </button>

                  </>
                )}
              </div>

              {error && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: 'rgba(255,0,0,0.1)',
                  borderRadius: '4px',
                  color: '#d32f2f'
                }}>
                  Error: {error.message}
                </div>
              )}

              {!isOriginalImage && (
                <div style={{
                  marginTop: '15px',
                  padding: '8px',
                  backgroundColor: 'rgba(0,255,0,0.1)',
                  borderRadius: '4px',
                  color: '#2e7d32'
                }}>
                  ✓ Image successfully remixed with AI! Check out the new portrait.
                </div>
              )}
            </CustomDialog>
          </div>
        )}
        <div className="right-img">
          <img
            src={currentImage}
            alt="Fernando Vargas portrait"
            style={{
              transition: 'all 0.5s ease-in-out',
              filter: isOriginalImage ? 'grayscale(100%)' : 'none',

            }}
          />
          {loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 5
            }}>
              <CircularProgress size={60} style={{ color: '#FF5722' }} />
            </div>
          )}
        </div>
      </div>
      <div className="social-link">
        <ul>
          <li><NavLink to="https://www.linkedin.com/in/fernando-vargas-16234254/">LinkedIn</NavLink></li>
        </ul>
      </div>
      <div className="visible-text">
        <h1>Developer</h1>
      </div>
    </section>
  )
}

export default Hero;