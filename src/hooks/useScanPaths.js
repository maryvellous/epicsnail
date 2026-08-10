import { useState, useEffect } from 'react';
import { useProjects } from '../context/ProjectsContext';

export function useScanPaths() {
  const { refreshProjects } = useProjects();
  const [scanPaths, setScanPaths] = useState([]);
  const [newPath, setNewPath] = useState('');

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getStoreData().then((data) => {
        if (data && data.scanPaths) {
          setScanPaths(data.scanPaths);
        }
      });
    }
  }, []);

  const handleAddPath = (e) => {
    if (e) e.preventDefault();
    if (!newPath.trim()) return;
    const updated = [...scanPaths, newPath.trim()];
    setScanPaths(updated);
    setNewPath('');
    if (window.electronAPI) {
      window.electronAPI.setStoreData('scanPaths', updated);
    }
    refreshProjects();
  };

  const handleRemovePath = (index) => {
    const updated = scanPaths.filter((_, i) => i !== index);
    setScanPaths(updated);
    if (window.electronAPI) {
      window.electronAPI.setStoreData('scanPaths', updated);
    }
    refreshProjects();
  };

  return {
    scanPaths,
    setScanPaths,
    newPath,
    setNewPath,
    handleAddPath,
    handleRemovePath,
  };
}

export default useScanPaths;
