import { InstructorRow } from '@/api/instructorsAdmin';

function fmtDate(): string {
  return new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function InstructorsCredentialsPrint({ instructors }: { instructors: InstructorRow[] }) {
  const active = instructors.filter(i => i.is_active);
  const grouped = new Map<string, InstructorRow[]>();
  for (const i of active) {
    const key = i.branch_name || 'Без филиала';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(i);
  }

  return (
    <div className="print-area print-only px-10 py-8">
      <h1 className="text-2xl font-bold mb-1">Автошкола «ВЕКТОР» — доступы к кабинету мастера</h1>
      <p className="text-sm text-gray-500 mb-8">Сформировано {fmtDate()} · адрес входа: /instructor</p>

      {Array.from(grouped.entries()).map(([branch, list]) => (
        <div key={branch} className="mb-8 break-inside-avoid">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">{branch}</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b-2 border-gray-400">
                <th className="py-2 pr-4">ФИО</th>
                <th className="py-2 pr-4">Логин</th>
                <th className="py-2 pr-4">Пароль</th>
              </tr>
            </thead>
            <tbody>
              {list.map(i => (
                <tr key={i.id} className="border-b border-gray-200">
                  <td className="py-2 pr-4">{i.name}</td>
                  <td className="py-2 pr-4 font-mono">{i.login}</td>
                  <td className="py-2 pr-4 font-mono">{i.plain_password || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
