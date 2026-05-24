"use client"

import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectStats } from '@/types/project';
import { ProjectService } from '@/services/projectService';
import { useWorkspace } from '@/contexts/workspace-context';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedWorkspace, loading: workspaceLoading } = useWorkspace();

  // Cargar proyectos filtrados por workspace
  // IMPORTANTE: currentProject NO debe estar en las dependencias para evitar
  // re-fetches infinitos cuando se auto-selecciona el primer proyecto.
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = selectedWorkspace
        ? await ProjectService.getProjectsByWorkspace(selectedWorkspace.id)
        : await ProjectService.getAllProjects();
      setProjects(projectsData);
      
      // Usamos actualización funcional para no depender de currentProject en el closure
      setCurrentProject(prev => {
        if (!prev) return projectsData[0] ?? null;
        // Si el proyecto actual no pertenece al nuevo workspace, resetear
        if (selectedWorkspace && prev.workspaceId !== selectedWorkspace.id) {
          return projectsData[0] ?? null;
        }
        return prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]); // solo depende del workspace, no de currentProject

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

  // Cargar datos iniciales — esperar a que el workspace context haya terminado de cargar
  // para evitar un fetch con selectedWorkspace=null seguido de otro con el workspace real.
  useEffect(() => {
    if (workspaceLoading) return;
    loadProjects();
    loadStats();
  }, [loadProjects, loadStats, workspaceLoading]);

  // Actualizar proyecto en la lista
  const updateProjectInList = useCallback((updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p))
    if (currentProject?.id === updatedProject.id) {
      setCurrentProject(updatedProject)
    }
  }, [currentProject]);

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
    updateProjectInList,
    deleteProject,
    runSeed,
  };
} 