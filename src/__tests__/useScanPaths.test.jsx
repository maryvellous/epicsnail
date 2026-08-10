// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScanPaths } from '../hooks/useScanPaths';

const mockRefreshProjects = vi.fn();

vi.mock('../context/ProjectsContext', () => ({
  useProjects: () => ({
    refreshProjects: mockRefreshProjects,
  }),
}));

describe('useScanPaths Custom Hook (Step 1)', () => {
  let mockGetStoreData;
  let mockSetStoreData;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoreData = vi.fn().mockResolvedValue({ scanPaths: ['C:/Projects/Alpha', 'C:/Projects/Beta'] });
    mockSetStoreData = vi.fn();

    global.window = {
      electronAPI: {
        getStoreData: mockGetStoreData,
        setStoreData: mockSetStoreData,
      },
    };
  });

  it('loads initial scan paths from electronAPI store on mount', async () => {
    const { result } = renderHook(() => useScanPaths());

    // Wait for the async useEffect effect to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetStoreData).toHaveBeenCalled();
    expect(result.current.scanPaths).toEqual(['C:/Projects/Alpha', 'C:/Projects/Beta']);
  });

  it('adds a new scan path, updates store and calls refreshProjects', async () => {
    const { result } = renderHook(() => useScanPaths());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setNewPath('C:/Projects/Gamma');
    });

    act(() => {
      result.current.handleAddPath({ preventDefault: () => {} });
    });

    expect(result.current.scanPaths).toEqual(['C:/Projects/Alpha', 'C:/Projects/Beta', 'C:/Projects/Gamma']);
    expect(result.current.newPath).toBe('');
    expect(mockSetStoreData).toHaveBeenCalledWith('scanPaths', [
      'C:/Projects/Alpha',
      'C:/Projects/Beta',
      'C:/Projects/Gamma',
    ]);
    expect(mockRefreshProjects).toHaveBeenCalled();
  });

  it('removes a scan path by index, updates store and calls refreshProjects', async () => {
    const { result } = renderHook(() => useScanPaths());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.handleRemovePath(0);
    });

    expect(result.current.scanPaths).toEqual(['C:/Projects/Beta']);
    expect(mockSetStoreData).toHaveBeenCalledWith('scanPaths', ['C:/Projects/Beta']);
    expect(mockRefreshProjects).toHaveBeenCalled();
  });

  it('degrades gracefully when window.electronAPI is undefined', async () => {
    delete global.window.electronAPI;

    const { result } = renderHook(() => useScanPaths());

    act(() => {
      result.current.setNewPath('C:/Projects/WebDemo');
    });

    act(() => {
      result.current.handleAddPath({ preventDefault: () => {} });
    });

    expect(result.current.scanPaths).toEqual(['C:/Projects/WebDemo']);
    expect(mockRefreshProjects).toHaveBeenCalled();
  });
});
