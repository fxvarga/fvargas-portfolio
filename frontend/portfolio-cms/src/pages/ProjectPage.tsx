import React from 'react';
import { useParams } from 'react-router';
import { useCMS } from '../context/CMSContext';
import parseJsonData from '../library/parseJson';

const ProjectPage = () => {
  const { slug } = useParams();
  const cms = useCMS();
  const project = cms?.Project?.find((p: any) => parseJsonData(p.jsonData).slug === slug)?.jsonData;
  console.log('Project Data:', project);

  if (!project) return <p>Project not found</p>;
  const parsedData = parseJsonData(project);

  return (
    <div>
      <h1>{parsedData.title}</h1>
      <img src={parsedData.featuredImage} alt={parsedData.title} />
      <div>{parsedData.description}</div>
      {/* Render blocks dynamically */}
    </div>
  );
};

export default ProjectPage;
