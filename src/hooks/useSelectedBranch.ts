import { useState, useEffect } from 'react';
import { getBranches, Branch } from '@/api/branches';

const STORAGE_KEY = 'vector_selected_branch_id';

export function useSelectedBranch() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<Branch | null>(null);

  useEffect(() => {
    getBranches().then(d => {
      const list = d.branches || [];
      setBranches(list);
      const savedId = Number(localStorage.getItem(STORAGE_KEY));
      const found = list.find(b => b.id === savedId);
      setSelected(found || list.find(b => b.is_default) || list[0] || null);
    }).catch(() => {});

    const onStorage = () => {
      const savedId = Number(localStorage.getItem(STORAGE_KEY));
      setBranches(prev => {
        const found = prev.find(b => b.id === savedId);
        if (found) setSelected(found);
        return prev;
      });
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('branch-changed', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('branch-changed', onStorage);
    };
  }, []);

  return selected;
}

export { STORAGE_KEY as BRANCH_STORAGE_KEY };
