import React, { useState } from "react";
import { NavLink } from 'react-router'
import { Link } from 'react-scroll'
import { useDevMode } from '../../main-component/State/DevModeProvider';
import CustomDialog from "../dialog/InsightsDialog";
import { useLazyQuery } from "@apollo/client";
import { remixImage } from "../../api/insightsApi";
import { CircularProgress } from "@mui/material";
import { useHero, useSiteConfig } from "../../context/CMSContext";

const Hero = () => {
  const { devMode } = useDevMode();
  const { hero, isLoading } = useHero();
  const { siteConfig } = useSiteConfig();
  
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isOriginalImage, setIsOriginalImage] = useState(true);
  const [remixImageQuery, { error, loading }] = useLazyQuery(remixImage, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.generateHeroImage) {
        setCurrentImage(data.generateHeroImage);
        setIsOriginalImage(false);
      }
    }
  });

  const handleRemixImage = () => {
    remixImageQuery({
      variables: {
        prompt: hero?.insightsDialog.prompt || "Generate a creative remix of this portfolio hero image"
      }
    });
  };

  if (isLoading || !hero) {
    return (
      <section className="tp-hero-section-1">
        <div className="container">
          <div className="row">
            <div className="col col-xs-7 col-lg-7">
              <div className="tp-hero-section-text">
                <CircularProgress />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const displayImage = currentImage || hero.image.url;

  return (
    <section className="tp-hero-section-1">
      <div className="container">
        <div className="row">
          <div className="col col-xs-7 col-lg-7">
            <div className="tp-hero-section-text">
              <div className="tp-hero-title">
                <h2>{hero.title}</h2>
              </div>
              <div className="tp-hero-sub">
                <p>{hero.name}</p>
              </div>
              <div className="btns">
                <Link activeClass="active" to={hero.ctaButton.scrollTo} spy={true} smooth={true} duration={500} offset={-95} className="theme-btn">
                  {hero.ctaButton.label}
                </Link>
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
            <CustomDialog title={hero.insightsDialog.title}>
              <p>{hero.insightsDialog.description}</p>
              <p>Prompt used: "{hero.insightsDialog.prompt}"</p>

              <div style={{ color: 'white', marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px' }}>
                    <CircularProgress size={24} style={{ marginRight: '10px' }} />
                    <span>Generating new portrait...</span>
                  </div>
                ) : (
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
                  Image successfully remixed with AI! Check out the new portrait.
                </div>
              )}
            </CustomDialog>
          </div>
        )}
        <div className="right-img">
          <img
            src={displayImage}
            alt={hero.image.alt}
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
          {siteConfig?.socialLinks.map((link, index) => (
            <li key={index}>
              <NavLink to={link.url}>{link.platform}</NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="visible-text">
        <h1>{hero.backgroundText}</h1>
      </div>
    </section>
  )
}

export default Hero;
