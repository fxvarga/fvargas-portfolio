import { useState, useEffect, useCallback } from 'react';
import { bookProjectsDb } from '@/lib/db';
import { generateId } from '@/lib/imageUtils';
import type { BookProject, CoverConfig, BookPage, PrintProductSlug } from '@/types';

export function useBookProjects() {
  const [projects, setProjects] = useState<BookProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const all = await bookProjectsDb.getAll();
    setProjects(all);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const createProject = useCallback(async (name: string, cover: CoverConfig): Promise<BookProject> => {
    const project: BookProject = {
      id: generateId(),
      name,
      cover,
      pages: [],
      skuSlug: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await bookProjectsDb.add(project);
    await reload();
    return project;
  }, [reload]);

  const updateProject = useCallback(async (project: BookProject) => {
    await bookProjectsDb.update(project);
    await reload();
  }, [reload]);

  const deleteProject = useCallback(async (id: string) => {
    await bookProjectsDb.delete(id);
    await reload();
  }, [reload]);

  const addPage = useCallback(async (projectId: string, page: BookPage) => {
    const project = await bookProjectsDb.get(projectId);
    if (!project) return;
    project.pages.push(page);
    await bookProjectsDb.update(project);
    await reload();
  }, [reload]);

  const updatePage = useCallback(async (projectId: string, page: BookPage) => {
    const project = await bookProjectsDb.get(projectId);
    if (!project) return;
    const idx = project.pages.findIndex(p => p.id === page.id);
    if (idx >= 0) {
      project.pages[idx] = page;
      await bookProjectsDb.update(project);
      await reload();
    }
  }, [reload]);

  const removePage = useCallback(async (projectId: string, pageId: string) => {
    const project = await bookProjectsDb.get(projectId);
    if (!project) return;
    project.pages = project.pages.filter(p => p.id !== pageId);
    await bookProjectsDb.update(project);
    await reload();
  }, [reload]);

  const reorderPages = useCallback(async (projectId: string, pageIds: string[]) => {
    const project = await bookProjectsDb.get(projectId);
    if (!project) return;
    const pageMap = new Map(project.pages.map(p => [p.id, p]));
    project.pages = pageIds.map(id => pageMap.get(id)!).filter(Boolean);
    await bookProjectsDb.update(project);
    await reload();
  }, [reload]);

  const setProjectSku = useCallback(async (projectId: string, skuSlug: PrintProductSlug) => {
    const project = await bookProjectsDb.get(projectId);
    if (!project) return;
    project.skuSlug = skuSlug;
    await bookProjectsDb.update(project);
    await reload();
  }, [reload]);

  return {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    addPage,
    updatePage,
    removePage,
    reorderPages,
    setProjectSku,
    reload,
  };
}
