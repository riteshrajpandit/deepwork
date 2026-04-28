"use client";
import React, { useState } from "react";
import { useAppContext } from "@/components/AppProvider";
import { Archive, FolderOpen, FileText, Folder, RotateCcw, Building2 } from "lucide-react";

export default function ArchivePage() {
  const { projects, files, restoreProject, restoreFile } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'Projects' | 'Documents'>('Projects');

  const archivedProjects = projects.filter(p => p.status === 'Archived');
  const archivedFiles = files.filter(f => f.isArchived);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-display-xl font-display-xl text-on-surface mb-1 flex items-center gap-3">
            <Archive size={32} className="text-primary" /> Archive
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant">Restore or permanently manage deleted items.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Navigation */}
        <div className="w-64 bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4 shrink-0 flex flex-col gap-2 ambient-shadow hidden md:flex">
          <button 
            onClick={() => setActiveTab('Projects')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${activeTab === 'Projects' ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}
          >
             <Building2 size={18} strokeWidth={activeTab === 'Projects' ? 2.5 : 2} /> Archived Projects
          </button>
          <button 
            onClick={() => setActiveTab('Documents')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${activeTab === 'Documents' ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}
          >
             <FileText size={18} strokeWidth={activeTab === 'Documents' ? 2.5 : 2} /> Archived Documents
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          
          {activeTab === 'Projects' && (
             <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-8 ambient-shadow max-w-4xl min-h-full">
                <h3 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center justify-between">
                   Archived Projects 
                   <span className="bg-outline-variant/30 text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-label-sm">{archivedProjects.length}</span>
                </h3>
                
                {archivedProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-outline-variant space-y-4 border-2 border-dashed border-outline-variant/30 rounded-xl">
                     <Archive size={48} className="opacity-40" />
                     <p className="text-body-md font-medium">No projects in the archive.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {archivedProjects.map(proj => (
                      <div key={proj.id} className="p-5 border border-outline-variant/50 rounded-xl bg-surface flex flex-col items-start hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2 w-full">
                           <FolderOpen size={20} className="text-outline-variant" />
                           <h4 className="text-body-lg font-medium text-on-surface truncate flex-1">{proj.name}</h4>
                        </div>
                        <p className="text-label-sm font-label-sm text-on-surface-variant mb-6 line-clamp-2">{proj.description}</p>
                        
                        <div className="mt-auto pt-4 border-t border-outline-variant/30 w-full flex justify-end">
                           <button
                             onClick={() => restoreProject(proj.id)}
                             className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-label-sm font-label-sm transition-colors cursor-pointer"
                           >
                             <RotateCcw size={16} /> Restore
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          )}

          {activeTab === 'Documents' && (
             <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-8 ambient-shadow max-w-4xl min-h-full">
                <h3 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center justify-between">
                   Archived Documents 
                   <span className="bg-outline-variant/30 text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-label-sm">{archivedFiles.length}</span>
                </h3>
                
                {archivedFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-outline-variant space-y-4 border-2 border-dashed border-outline-variant/30 rounded-xl">
                     <Archive size={48} className="opacity-40" />
                     <p className="text-body-md font-medium">No files in the archive.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {archivedFiles.map(file => {
                       const parentProj = projects.find(p => p.id === file.projectId);
                       return (
                         <div key={file.id} className="p-4 border border-outline-variant/50 rounded-xl bg-surface flex flex-row items-center justify-between hover:shadow-sm transition-shadow">
                           <div className="flex items-center gap-4">
                             <div className="p-2 bg-surface-container-high rounded-lg shrink-0">
                               {file.type === 'folder' ? <Folder size={20} className="text-outline-variant" /> : <FileText size={20} className="text-outline-variant" />}
                             </div>
                             <div>
                               <h4 className="text-body-md font-medium text-on-surface mb-0.5">{file.name}</h4>
                               <p className="text-[12px] text-outline-variant">Original Location: {parentProj?.name || 'Unknown Project'}</p>
                             </div>
                           </div>
                           <button 
                             onClick={() => restoreFile(file.id)}
                             className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-label-sm font-label-sm transition-colors cursor-pointer shrink-0"
                           >
                             <RotateCcw size={16} /> Restore
                           </button>
                         </div>
                       );
                    })}
                  </div>
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
