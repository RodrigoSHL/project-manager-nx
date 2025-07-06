import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectStats, ProjectStatus } from '@/types/project';
import { projectService } from '@/services/projectService';

interface UseProjectsReturn {
  projects: Project[];
  currentProject: Project | null;
  stats: ProjectStats | null;
  loading: boolean;
  error: string | null;
  getAllProjects: () => Promise<void>;
  getProjectById: (id: string) => Promise<void>;
  getProjectStats: () => Promise<void>;
  getProjectsByStatus: (status: ProjectStatus) => Promise<void>;
  getProjectsByBusinessUnit: (businessUnit: string) => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, projectData: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  runSeed: () => Promise<void>;
  clearError: () => void;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Error en useProjects:', error);
    setError(error.message || 'Error desconocido');
    setLoading(false);
  }, []);

  const getAllProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getProjectById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjectById(id);
      setCurrentProject(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getProjectStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjectStats();
      setStats(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getProjectsByStatus = useCallback(async (status: ProjectStatus) => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjectsByStatus(status);
      setProjects(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getProjectsByBusinessUnit = useCallback(async (businessUnit: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjectsByBusinessUnit(businessUnit);
      setProjects(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createProject = useCallback(async (projectData: Partial<Project>): Promise<Project> => {
    try {
      setLoading(true);
      setError(null);
      const newProject = await projectService.createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateProject = useCallback(async (id: string, projectData: Partial<Project>): Promise<Project> => {
    try {
      setLoading(true);
      setError(null);
      const updatedProject = await projectService.updateProject(id, projectData);
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      if (currentProject?.id === id) {
        setCurrentProject(updatedProject);
      }
      return updatedProject;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, handleError]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await projectService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, handleError]);

  const runSeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await projectService.runSeed();
      // Recargar los proyectos después del seed
      await getAllProjects();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [getAllProjects, handleError]);

  return {
    projects,
    currentProject,
    stats,
    loading,
    error,
    getAllProjects,
    getProjectById,
    getProjectStats,
    getProjectsByStatus,
    getProjectsByBusinessUnit,
    createProject,
    updateProject,
    deleteProject,
    runSeed,
    clearError,
  };
} 