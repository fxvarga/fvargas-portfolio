import React from 'react';
import { Routes, Route } from 'react-router';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import Layout from './components/Layout';
import ProjectListPage from './pages/ProjectListPage';

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects" element={<ProjectListPage />} />
      <Route path="/projects/:slug" element={<ProjectPage />} />
    </Routes>
  </Layout>
);

export default App;
