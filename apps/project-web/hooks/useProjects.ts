"use client"

import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectStats } from '@/types/project';
import { ProjectService } from '@/services/projectService';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar todos los proyectos
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await ProjectService.getAllProjects();
      setProjects(projectsData);
      
      // Si no hay proyecto seleccionado y hay proyectos disponibles, seleccionar el primero
      if (!currentProject && projectsData.length > 0) {
        setCurrentProject(projectsData[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const statsData = await ProjectService.getProjectStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  }, []);

  // Cargar proyecto específico
  const loadProject = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const projectData = await ProjectService.getProjectById(id);
      setCurrentProject(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proyecto');
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear nuevo proyecto
  const createProject = useCallback(async (projectData: Partial<Project>) => {
    try {
      setLoading(true);
      setError(null);
      const newProject = await ProjectService.createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar proyecto
  const updateProject = useCallback(async (id: string, projectData: Partial<Project>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedProject = await ProjectService.updateProject(id, projectData);
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      
      // Si es el proyecto actual, actualizarlo también
      if (currentProject?.id === id) {
        setCurrentProject(updatedProject);
      }
      
      return updatedProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar proyecto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  // Eliminar proyecto
  const deleteProject = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await ProjectService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      
      // Si es el proyecto actual, limpiarlo
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar proyecto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  // Ejecutar seed
  const runSeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await ProjectService.runSeed();
      await loadProjects(); // Recargar proyectos después del seed
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar seed');
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  // Cargar datos iniciales
  useEffect(() => {
    loadProjects();
    loadStats();
  }, [loadProjects, loadStats]);

  return {
    projects,
    currentProject,
    stats,
    loading,
    error,
    setCurrentProject,
    loadProjects,
    loadProject,
    createProject,
    updateProject,
    deleteProject,
    runSeed,
  };
} 