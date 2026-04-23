import type { Resume } from './types';

export const resume: Resume = {
  education: [
    {
      institution: 'University of North Carolina at Charlotte',
      degree: 'Bachelor of Fine Arts',
      field: 'Illustration, Graphic Design',
    },
  ],
  experience: [
    {
      dates: 'June 2025 – Present',
      company: 'Outlier.ai',
      role: 'AI Training Contributor & Freelance Consultant',
      location: 'Remote',
      highlights: [
        'Contributing to AI model training and evaluation across code, design, and general tasks',
        'Applied UI/UX design expertise to assess and improve AI-generated outputs',
        'Completed OutlierEDU certifications in Agent Coding, Prompt Engineering, and AI interaction disciplines',
      ],
    },
    {
      dates: 'July 2024 – June 2025',
      company: 'Career Break',
      role: 'Personal & Professional Reassessment',
      location: 'Charlotte, NC',
    },
    {
      dates: 'February 2023 – July 2024',
      company: 'Spacelabs Healthcare',
      role: 'Senior UI/UX Designer',
      location: 'Charlotte, NC (Remote)',
      highlights: [
        'Owned integration of Rothman Index platform into Spacelabs Healthcare, aligning design strategies and UX standards',
        'Collaborated on three major products: The Rothman Index, SafeNSound, and Rainer Monitor software platform',
        'Delivered comprehensive UI/UX design support including design, prototyping, and user feedback integration',
        'Developed user-centered design solutions prioritizing usability and accessibility, ensuring WCAG compliance',
        'Actively collaborated with cross-functional teams to align design objectives with product goals',
      ],
    },
    {
      dates: 'October 2018 – February 2023',
      company: 'PeraHealth: The Rothman Index',
      role: 'Senior UI/UX Engineer',
      location: 'Charlotte, NC (Remote)',
      highlights: [
        'Finalized design and assisted with frontend development of Rothman Index mobile app, achieving FDA 508 clearance',
        'Developed and maintained a cohesive visual library serving as the single source of truth for design standards',
        'Enhanced the Rothman Index platform and suite (RI Trend, RI Mobile, RI Analytics) with updated UI/UX post-rebrand',
        'Created interactive prototypes for user testing, gathering feedback to refine design solutions',
        'Iterated on designs based on client and user feedback, improving accessibility across all products per WCAG standards',
      ],
    },
    {
      dates: 'April 2012 – June 2018',
      company: 'AXS Group LLC (Carbonhouse)',
      role: 'Front-End Web Developer',
      location: 'Charlotte, NC',
      highlights: [
        'Maintained ownership of full development lifecycle for 70+ world-class venue websites',
        'Leveraged automated deployment using Ansible, Git, and Circle CI to push tested code to AWS environments',
        'Setup development tools for responsive and adaptive standards using mobile-first approach',
      ],
    },
    {
      dates: 'October 2006 – April 2012',
      company: 'American City Business Journals',
      role: 'UI Designer / Front-End Web Developer',
      location: 'Charlotte, NC',
      highlights: [
        'Led full site redesign of The Business Journals, successfully deployed across 45 markets in 2010',
        'Defined design/UX patterns while leveraging analytical data to optimize designs across 40+ client websites',
        'Created wireframes and hand-coded front-end experience for the complete site redesign',
      ],
    },
    {
      dates: '2006',
      company: 'Apex Systems',
      role: 'Web Designer / HTML & CSS Developer',
      location: 'Charlotte, NC (Contract-to-Hire)',
    },
  ],
};
