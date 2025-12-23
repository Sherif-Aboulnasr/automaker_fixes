import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Project } from '@/lib/electron';

interface UseProjectPickerProps {
  projects: Project[];
  currentProject: Project | null;
  isProjectPickerOpen: boolean;
  setIsProjectPickerOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setCurrentProject: (project: Project) => void;
}

export function useProjectPicker({
  projects,
  currentProject,
  isProjectPickerOpen,
  setIsProjectPickerOpen,
  setCurrentProject,
}: UseProjectPickerProps) {
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const projectSearchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filtered projects based on search query
  const filteredProjects = useMemo(() => {
    if (!projectSearchQuery.trim()) {
      return projects;
    }
    const query = projectSearchQuery.toLowerCase();
    return projects.filter((project) => project.name.toLowerCase().includes(query));
  }, [projects, projectSearchQuery]);

  // Helper function to scroll to a specific project
  const scrollToProject = useCallback((projectId: string) => {
    if (!scrollContainerRef.current) return;

    const element = scrollContainerRef.current.querySelector(
      `[data-testid="project-option-${projectId}"]`
    ) as HTMLElement;

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, []);

  // Initialize state when dropdown opens, reset when it closes
  useEffect(() => {
    if (!isProjectPickerOpen) {
      setProjectSearchQuery('');
      setSelectedProjectIndex(0);
      return;
    }

    // When opening, find and select the current project
    const currentIndex = currentProject
      ? filteredProjects.findIndex((p) => p.id === currentProject.id)
      : -1;

    const initialIndex = currentIndex !== -1 ? currentIndex : 0;
    setSelectedProjectIndex(initialIndex);

    // Focus search input and scroll to current project after DOM renders
    requestAnimationFrame(() => {
      projectSearchInputRef.current?.focus();

      // Scroll to the current project
      const targetProject = filteredProjects[initialIndex];
      if (targetProject) {
        scrollToProject(targetProject.id);
      }
    });
  }, [isProjectPickerOpen, currentProject?.id]);

  // Update selection when search query changes (while picker is open)
  useEffect(() => {
    if (!isProjectPickerOpen || !projectSearchQuery.trim()) return;

    // When searching, reset to first result
    setSelectedProjectIndex(0);
  }, [isProjectPickerOpen, projectSearchQuery]);

  // Scroll to highlighted item when selection changes via keyboard
  useEffect(() => {
    if (!isProjectPickerOpen) return;

    const targetProject = filteredProjects[selectedProjectIndex];
    if (targetProject) {
      scrollToProject(targetProject.id);
    }
  }, [selectedProjectIndex, isProjectPickerOpen, filteredProjects, scrollToProject]);

  // Handle selecting the currently highlighted project
  const selectHighlightedProject = useCallback(() => {
    if (filteredProjects.length > 0 && selectedProjectIndex < filteredProjects.length) {
      setCurrentProject(filteredProjects[selectedProjectIndex]);
      setIsProjectPickerOpen(false);
    }
  }, [filteredProjects, selectedProjectIndex, setCurrentProject, setIsProjectPickerOpen]);

  // Handle keyboard events when project picker is open
  useEffect(() => {
    if (!isProjectPickerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProjectPickerOpen(false);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        selectHighlightedProject();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedProjectIndex((prev) => (prev < filteredProjects.length - 1 ? prev + 1 : prev));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedProjectIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (event.key.toLowerCase() === 'p' && !event.metaKey && !event.ctrlKey) {
        // Toggle off when P is pressed (not with modifiers) while dropdown is open
        // Only if not typing in the search input
        if (document.activeElement !== projectSearchInputRef.current) {
          event.preventDefault();
          setIsProjectPickerOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isProjectPickerOpen,
    selectHighlightedProject,
    filteredProjects.length,
    setIsProjectPickerOpen,
  ]);

  return {
    projectSearchQuery,
    setProjectSearchQuery,
    selectedProjectIndex,
    setSelectedProjectIndex,
    projectSearchInputRef,
    scrollContainerRef,
    filteredProjects,
    selectHighlightedProject,
  };
}
