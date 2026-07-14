import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { getBranches, Branch } from '@/api/branches';

const STORAGE_KEY = 'vector_selected_branch_id';

export default function BranchSelector() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<Branch | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getBranches().then(d => {
      const list = d.branches || [];
      setBranches(list);
      const savedId = Number(localStorage.getItem(STORAGE_KEY));
      const found = list.find(b => b.id === savedId);
      setSelected(found || list.find(b => b.is_default) || list[0] || null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selectBranch = (b: Branch) => {
    setSelected(b);
    localStorage.setItem(STORAGE_KEY, String(b.id));
    window.dispatchEvent(new Event('branch-changed'));
    setOpen(false);
  };

  if (!selected) return null;

  const phoneHref = `tel:${selected.phone.replace(/[^\d+]/g, '')}`;

  return (
    <>
      <div ref={wrapRef} className="relative flex items-center gap-6 text-xs">
        <button
          onClick={() => branches.length > 1 && setOpen(o => !o)}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <Icon name="MapPin" size={12} />
          {selected.address}
          {branches.length > 1 && <Icon name="ChevronDown" size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
        </button>
        <span className="flex items-center gap-1.5">
          <Icon name="Clock" size={12} />
          {selected.work_hours}
        </span>

        {open && branches.length > 1 && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
            {branches.map(b => (
              <button
                key={b.id}
                onClick={() => selectBranch(b)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                  b.id === selected.id ? 'bg-red-50' : ''
                }`}
              >
                <Icon name="MapPin" size={14} className={`mt-0.5 flex-shrink-0 ${b.id === selected.id ? 'text-[#E8002D]' : 'text-gray-400'}`} />
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${b.id === selected.id ? 'text-[#E8002D]' : 'text-[#1a1a1a]'}`}>{b.name}</p>
                  <p className="text-xs text-gray-500 truncate">{b.address}</p>
                  <p className="text-xs text-gray-400">{b.phone} · {b.work_hours}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <a
        href={phoneHref}
        className="text-white font-semibold hover:text-[#E8002D] transition-colors flex items-center gap-1.5"
      >
        <Icon name="Phone" size={12} />
        {selected.phone}
      </a>
    </>
  );
}