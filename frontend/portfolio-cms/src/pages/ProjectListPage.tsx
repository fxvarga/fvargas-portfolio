// File: src/pages/ProjectListPage.tsx
import React from 'react';
import { Link } from 'react-router';
import { useCMS } from '../context/CMSContext';
import parseJsonData from '../library/parseJson';

const ProjectListPage = () => {
  const cms = useCMS();
  const projects = cms?.Project || [];
  console.log('CMS Projects:', projects);

  return (
    <section>
      <h2>Projects</h2>
      <ul>
        {projects.map((proj: any) => {

          const parsedData = parseJsonData(proj.jsonData);
          return (
            <>
              < li key={proj.id} >
                <Link to={`/projects/${parsedData.slug}`}>{parsedData.title}</Link>
              </li>
            </>
          )
        })}
      </ul>
    </section >
  );
};

export default ProjectListPage;