import React from 'react';
import { FileActions } from './FileActions';
import { formatBytes, relativeDate, getFileIcon } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { FileItem } from '@/types/index';
import { Eye, Folder, FileText, Code, Film, Music } from 'lucide-react';

const ICON_BY_TYPE: Record<string, React.ReactNode> = {
  image: <Eye className="h-5 w-5" />,
  'file-text': <FileText className="h-5 w-5" />,
  'file-zip': <Folder className="h-5 w-5 text-amber-400" />,
  code: <Code className="h-5 w-5" />,
  film: <Film className="h-5 w-5" />,
  music: <Music className="h-5 w-5" />,
  default: <Folder className="h-5 w-5 text-neutral-400" />,
};

interface FileRowProps {
  file: FileItem;
}

export function FileRow({ file }: FileRowProps) {
  const iconName = getFileIcon(file.type, file.name);
  const Icon = ICON_BY_TYPE[iconName] ?? ICON_BY_TYPE.default;
  const colorByType: Record<string, string> = {
    image: 'text-blue-400',
    'file-text': 'text-neutral-400',
    'file-zip': 'text-amber-400',
    code: 'text-blue-400',
    film: 'text-purple-400',
    music: 'text-pink-400',
    default: 'text-neutral-400',
  };

  return (
    <tr className="hover:bg-neutral-50/50 transition group">
      <td className="font-medium text-neutral-900 flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-neutral-100">
          {React.cloneElement(Icon as React.ReactElement, {
            className: `${colorByType[iconName] ?? 'text-neutral-400'}`,
          })}
        </div>
        <div>
          <div className="font-medium">{file.name}</div>
          <div className="text-[11px] text-neutral-500 truncate max-w-[200px]">
            {file.key}
          </div>
        </div>
      </td>
      <td>
        <Badge variant="outline" className="text-[11px]">
          {file.type.split('/').pop() ?? file.type}
        </Badge>
      </td>
      <td className="text-neutral-700 font-mono text-xs">{formatBytes(file.size)}</td>
      <td className="text-neutral-500 text-xs">{relativeDate(file.lastModified)}</td>
      <td className="text-neutral-600 text-xs">{file.bucket.split('-').pop() ?? file.bucket}</td>
      <td><FileActions file={file} /></td>
    </tr>
  );
}
