import { LayoutList, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ViewToggle({ active, onChange }: { active: 'list' | 'grid'; onChange: (v: 'list' | 'grid') => void }) {
  return (
    <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-1">
      <Button
        variant={active === 'list' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onChange('list')}
        title="Vista lista"
      >
        <LayoutList className="h-4 w-4" />
      </Button>
      <Button
        variant={active === 'grid' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onChange('grid')}
        title="Vista tarjetas"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
