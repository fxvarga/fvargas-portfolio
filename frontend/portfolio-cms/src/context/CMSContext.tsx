// File: src/context/CMSContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';

const GET_ALL_RECORDS = gql`
  query GetRecords($entityType: String!) {
    getEntityRecords(entityType: $entityType) {
      id
      data
    }
  }
`;


export const CMSContext = createContext<any>({});

export const CMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<any>({});
  const entities = ['Hero', 'About', 'Project', 'Skill', 'Client', 'CaseStudy', 'Contact'];

  const loadData = async () => {
    const data: any = {};
    for (const type of entities) {
      try {
        const res = await fetch('https://localhost:7007/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query GetRecords($entityType: String!) {
              entityRecords(entityType: $entityType) {
                id
                entityType
                jsonData
              }
            }`,
            variables: { entityType: type }
          })
        });
        const json = await res.json();
        data[type] = json.data.entityRecords;
      } catch (err) {
        console.error(`Failed loading ${type}`, err);
      }
    }
    setContent(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  return <CMSContext.Provider value={content}>{children}</CMSContext.Provider>;
};

export const useCMS = () => useContext(CMSContext);

