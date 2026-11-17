import { Routes, Route } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Dashboard from '@/pages/Dashboard';
import FileExplorer from '@/pages/FileExplorer';
import Upload from '@/pages/Upload';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/archivos" element={<FileExplorer />} />
          <Route path="/subir" element={<Upload />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
