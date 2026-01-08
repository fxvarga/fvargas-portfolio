/**
 * Parallax Scrolling Cards Demo Component
 * 
 * A smooth parallax scrolling effect for card layouts with depth and motion
 * triggered by mouse position and scroll, using CSS transforms for 3D depth.
 */

import React, { useState, useRef } from 'react';
import './ParallaxScrollingCards.css';

interface CardProps {
  title: string;
  description: string;
  image: string;
  icon: string;
  depth: number;
  mouseX: number;
  mouseY: number;
}

const Card: React.FC<CardProps> = ({ title, description, image, icon, depth, mouseX, mouseY }) => {
  // Calculate parallax offset based on mouse position and card depth
  const translateX = (mouseX - 50) * depth * 0.3;
  const translateY = (mouseY - 50) * depth * 0.2;
  const rotateY = (mouseX - 50) * depth * 0.05;
  const rotateX = -(mouseY - 50) * depth * 0.05;

  return (
    <div 
      className="parallax-card"
      style={{
        transform: `
          translateX(${translateX}px) 
          translateY(${translateY}px) 
          rotateY(${rotateY}deg) 
          rotateX(${rotateX}deg)
          translateZ(${depth * 20}px)
        `
      }}
    >
      <div className="card-image">
        <img src={image} alt={title} />
        <div className="card-overlay" />
      </div>
      <div className="card-content">
        <span className="card-icon">{icon}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};

interface ParallaxScrollingCardsProps {
  className?: string;
}

const ParallaxScrollingCards: React.FC<ParallaxScrollingCardsProps> = ({ className }) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [intensity, setIntensity] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const cards = [
    {
      title: "Mountain Adventure",
      description: "Explore breathtaking peaks and valleys",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      icon: "🏔️",
      depth: 1
    },
    {
      title: "Ocean Exploration",
      description: "Dive into mysterious ocean depths",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
      icon: "🌊",
      depth: 2
    },
    {
      title: "Forest Journey",
      description: "Wander through ancient forests",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
      icon: "🌲",
      depth: 1.5
    },
    {
      title: "Desert Discovery",
      description: "Experience vast desert beauty",
      image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=300&fit=crop",
      icon: "🏜️",
      depth: 2.5
    }
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    }
  };

  const handleMouseLeave = () => {
    // Smoothly return to center
    setMousePos({ x: 50, y: 50 });
  };

  return (
    <div className={`parallax-scrolling-cards-demo ${className || ''}`}>
      <div className="demo-header">
        <h4>Parallax Scrolling Cards</h4>
        <p>Move your mouse over the cards to see 3D parallax depth effects</p>
      </div>

      <div 
        className="parallax-container" 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="cards-grid">
          {cards.map((card, index) => (
            <Card
              key={index}
              {...card}
              depth={card.depth * intensity}
              mouseX={mousePos.x}
              mouseY={mousePos.y}
            />
          ))}
        </div>
      </div>

      <div className="demo-controls">
        <div className="control-group">
          <label>Parallax Intensity: {intensity.toFixed(1)}x</label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
          />
        </div>
        <div className="mouse-position">
          <span>Mouse: X {Math.round(mousePos.x)}% Y {Math.round(mousePos.y)}%</span>
        </div>
      </div>

      <div className="demo-info">
        <h5>Features</h5>
        <ul>
          <li>Mouse-tracking parallax with variable depth layers</li>
          <li>3D transforms (translateX/Y/Z, rotateX/Y)</li>
          <li>Smooth CSS transitions with perspective</li>
          <li>Responsive grid layout with hover effects</li>
          <li>Configurable parallax intensity</li>
        </ul>
      </div>
    </div>
  );
};

export default ParallaxScrollingCards;