"use client";
import React, { use, useState, useEffect } from "react";
import { useAppContext, Task, formatFriendlyDate, FileNode } from "@/components/AppProvider";
import { useParams } from "next/navigation";
import { Plus, MoreHorizontal, Calendar, Target, LayoutGrid, Folder, FileText, ChevronRight, Upload, X, Archive } from "lucide-react";
import Image from "next/image";
import { DocumentEditor } from "@/components/DocumentEditor";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export default function ProjectDashboard(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const id = params.id;
  const { projects, tasks, users, files, addFile, updateFileContent, setTaskModalOpen, updateTaskStatus, archiveProject, archiveFile } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'Board' | 'Documents'>('Board');
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    
    // Changing statuses drops it to the bottom essentially for now in our mock state
    if (destination.droppableId !== source.droppableId) {
      updateTaskStatus(draggableId, destination.droppableId as Task['status']);
    }
  };
  
  // Documents State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeType, setNewTypeType] = useState<'folder' | 'file'>('folder');

  const project = projects.find(p => p.id === id);
  if (!project) return <div>Project not found</div>;

  const projectTasks = tasks.filter(t => t.projectId === id);
  const columns: Task['status'][] = ['Todo', 'In Progress', 'Done'];

  const projectFiles = files.filter(f => f.projectId === id && !f.isArchived);
  const currentFiles = projectFiles.filter(f => f.parentId === currentFolderId);
  const breadcrumbs = [];
  let curr = currentFolderId;
  while (curr) {
    const fNode = projectFiles.find(f => f.id === curr);
    if (fNode) {
      breadcrumbs.unshift(fNode);
      curr = fNode.parentId;
    } else {
      break;
    }
  }

  const handleCreateFileNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    addFile({
      projectId: id,
      type: newTypeType,
      name: newTypeName.trim(),
      parentId: currentFolderId,
      content: newTypeType === 'file' ? '' : undefined,
      attachedMemberIds: []
    });
    setNewTypeName("");
    setIsCreateModalOpen(false);
  };

  const handleDocumentChange = (id: string, content: string) => {
    updateFileContent(id, content);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addFile({
            projectId: id,
            type: 'upload',
            name: file.name,
            parentId: currentFolderId,
            fileData: event.target.result as string,
            fileType: file.type,
            attachedMemberIds: []
          });
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
        <div>
          <h2 className="text-display-xl font-display-xl text-on-surface mb-2 leading-none">{project.name}</h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">{project.description}</p>
        </div>
        
        <div className="flex bg-surface-container border border-outline-variant/30 rounded-lg p-1 shadow-sm mt-2 md:mt-0">
          <button 
            onClick={() => archiveProject(project.id)}
            className="px-4 py-1.5 flex items-center gap-2 rounded-md text-label-sm font-label-sm text-error hover:bg-error-container hover:text-on-error-container transition-all cursor-pointer mr-2"
          >
             <Archive size={16} /> Archive Project
          </button>
          <button 
            onClick={() => { setActiveTab('Board'); setActiveDocumentId(null); }}
            className={`px-4 py-1.5 flex items-center gap-2 rounded-md text-label-sm font-label-sm transition-all cursor-pointer ${activeTab === 'Board' ? 'bg-surface shadow-sm text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
          >
             <LayoutGrid size={16} /> Board
          </button>
          <button 
            onClick={() => setActiveTab('Documents')}
            className={`px-4 py-1.5 flex items-center gap-2 rounded-md text-label-sm font-label-sm transition-all cursor-pointer ${activeTab === 'Documents' ? 'bg-surface shadow-sm text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
          >
             <Folder size={16} /> Documents
          </button>
        </div>
      </div>

      {activeTab === 'Board' && (
        <>
          <div className="flex justify-end mb-4">
             <button 
               onClick={() => setTaskModalOpen({ open: true, projectId: project.id })}
               className="bg-primary text-on-primary px-4 py-2.5 rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
             >
               <Plus size={18} /> Add Task
             </button>
          </div>
          {isMounted && (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex-1 flex gap-6 overflow-x-auto no-scrollbar pb-4 bg-surface-container-lowest/50 rounded-xl p-2 h-full items-stretch">
                {columns.map(status => {
                  const colTasks = projectTasks.filter(t => t.status === status);
                  
                  return (
                    <div key={status} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col h-[calc(100vh-220px)] bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
                      <div className="flex justify-between items-center mb-4 px-2 shrink-0">
                        <h3 className="text-body-md font-body-md font-semibold text-on-surface flex items-center gap-2">
                          {status} 
                          <span className="bg-surface-container-high text-on-surface-variant text-[11px] px-2 py-0.5 rounded-full">{colTasks.length}</span>
                        </h3>
                        <button className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container transition-colors cursor-pointer"><MoreHorizontal size={18} /></button>
                      </div>

                      <Droppable droppableId={status}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.droppableProps}
                            className={`flex-1 overflow-y-auto no-scrollbar min-h-[100px] p-1 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-surface-container/50' : ''}`}
                          >
                            <div className="space-y-3 min-h-[20px]">
                              {colTasks.map((task, index) => {
                                const assignees = users.filter(u => task.assigneeIds.includes(u.id));
                                
                                return (
                                  <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div 
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`bg-surface border rounded-lg p-4 ambient-shadow group ${snapshot.isDragging ? 'border-primary shadow-xl rotate-1 z-50' : 'border-outline-variant/30 hover:border-primary/40 hover:shadow-md'} transition-colors`}
                                        style={{...provided.draggableProps.style}}
                                      >
                                        <div className="flex justify-between items-start mb-2">
                                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                                            task.priority === 'High' ? 'bg-error-container text-on-error-container' : 
                                            task.priority === 'Medium' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                                          }`}>
                                            {task.priority}
                                          </span>
                                          
                                          <select 
                                            value={task.status} 
                                            onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-surface-container-low border border-outline-variant/50 rounded px-1.5 py-0.5 outline-none text-on-surface-variant cursor-pointer hover:text-on-surface"
                                          >
                                            {columns.map(c => <option key={c} value={c}>Move to {c}</option>)}
                                          </select>
                                        </div>
                                        
                                        <h4 className="text-body-md font-body-md font-medium text-on-surface mb-3">{task.title}</h4>
                                        
                                        <div className="flex justify-between items-center">
                                          <span className="flex items-center gap-1.5 text-label-sm font-label-sm text-outline">
                                            <Calendar size={14} />
                                            {formatFriendlyDate(task.dueDate)}
                                          </span>
                                          
                                          <div className="flex -space-x-1.5">
                                            {assignees.map(u => (
                                              <div key={u.id} className="w-6 h-6 rounded-full border-2 border-surface overflow-hidden bg-surface-container" title={u.name}>
                                                <Image src={u.avatar} width={24} height={24} alt={u.name} className="w-full h-full object-cover" unoptimized />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                            {colTasks.length === 0 && !snapshot.isDraggingOver && (
                              <div className="h-24 border-2 border-dashed border-outline-variant/30 rounded-lg flex items-center justify-center text-outline text-label-sm font-label-sm mt-3 pointer-events-none">
                                Drop tasks here
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </>
      )}

      {activeTab === 'Documents' && (
        <div className="flex-1 flex gap-6 overflow-hidden">
           
           {/* Side Navigation / Folder Structure */}
           <div className={`flex flex-col bg-surface-container-lowest border border-outline-variant/50 rounded-xl ambient-shadow overflow-hidden transition-all duration-300 ${activeDocumentId ? 'w-64 hidden xl:flex shrink-0' : 'w-full'}`}>
             
             <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface shrink-0">
               <div className="flex items-center gap-2 overflow-hidden">
                 <button onClick={() => setCurrentFolderId(null)} className="text-on-surface-variant hover:text-primary font-medium text-label-sm truncate cursor-pointer transition-colors">
                   Root
                 </button>
                 {breadcrumbs.map(bc => (
                   <React.Fragment key={bc.id}>
                     <ChevronRight size={14} className="text-outline-variant shrink-0" />
                     <button onClick={() => setCurrentFolderId(bc.id)} className="text-on-surface-variant hover:text-primary font-medium text-label-sm truncate cursor-pointer transition-colors">
                       {bc.name}
                     </button>
                   </React.Fragment>
                 ))}
               </div>
               
               {!activeDocumentId && (
                 <div className="flex items-center gap-2 shrink-0">
                   <label className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant cursor-pointer rounded-md transition-colors flex items-center justify-center">
                     <Upload size={18} />
                     <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                   </label>
                   <button onClick={() => setIsCreateModalOpen(true)} className="p-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors cursor-pointer">
                     <Plus size={18} />
                   </button>
                 </div>
               )}
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 gap-2">
                  {currentFiles.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-outline-variant text-label-sm flex flex-col items-center justify-center gap-3 border-2 border-dashed border-outline-variant/30 rounded-xl m-2">
                       <Folder size={32} className="opacity-20" />
                       This folder is empty.
                    </div>
                  ) : currentFiles.map(file => (
                    <button 
                      key={file.id}
                      onClick={() => {
                        if (file.type === 'folder') setCurrentFolderId(file.id);
                        if (file.type === 'file' || file.type === 'upload') setActiveDocumentId(file.id);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left group cursor-pointer ${
                        activeDocumentId === file.id 
                        ? 'bg-primary/5 border-primary/30 text-primary' 
                        : 'border-outline-variant/20 hover:border-outline-variant/50 hover:bg-surface-container-low hover:shadow-sm'
                      }`}
                    >
                      {file.type === 'folder' 
                        ? <Folder size={20} className="text-primary opacity-80" fill="currentColor" fillOpacity={0.2} /> 
                        : <FileText size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />}
                      <span className="text-body-md font-body-md truncate font-medium">{file.name}</span>
                    </button>
                  ))}
                </div>
             </div>

           </div>

           {/* Editor View */}
           {activeDocumentId && (
              <div className="flex-1 flex flex-col min-w-0 bg-surface-container-lowest border border-outline-variant/50 rounded-xl ambient-shadow p-6 relative">
                 <button 
                   onClick={() => setActiveDocumentId(null)}
                   className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
                 >
                   <X size={20} />
                 </button>
                 
                 {(() => {
                   const doc = files.find(f => f.id === activeDocumentId);
                   if (!doc) return <div>Document not found.</div>;
                   
                   return (
                     <div className="flex flex-col h-full">
                       <div className="mb-6 mr-12 shrink-0">
                         <h3 className="text-display-xl font-display-xl text-on-surface leading-tight mb-2 outline-none" contentEditable={doc.type === 'file'} suppressContentEditableWarning>
                           {doc.name.replace('.html', '')}
                         </h3>
                         <div className="flex items-center gap-4 text-label-sm font-label-sm text-outline-variant">
                           <span className="flex items-center gap-1.5 bg-surface-container px-2 py-1 rounded-md text-on-surface">
                             Created by {users.find(u => u.id === doc.uploaderId)?.name || 'Unknown'}
                           </span>
                           <span>Type: {doc.type === 'file' ? 'Rich Text Document' : 'Uploaded File'}</span>
                           <button 
                             onClick={() => { archiveFile(doc.id); setActiveDocumentId(null); }}
                             className="text-error hover:text-on-error-container hover:bg-error-container px-2 py-1 rounded transition-colors ml-auto flex items-center gap-1 cursor-pointer"
                           >
                             <Archive size={14} /> Archive Document
                           </button>
                         </div>
                       </div>
                       
                       <div className="flex-1 min-h-[400px] flex flex-col items-stretch">
                         {doc.type === 'file' ? (
                           <DocumentEditor 
                             content={doc.content || ''} 
                             onChange={(val) => handleDocumentChange(doc.id, val)}
                           />
                         ) : (
                           <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden p-6 ambient-shadow">
                             {doc.fileType?.startsWith('image/') ? (
                               <img src={doc.fileData} alt={doc.name} className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm" />
                             ) : (
                               <div className="flex flex-col items-center justify-center text-center p-8">
                                 <FileText size={64} className="text-outline-variant mb-4" />
                                 <h4 className="text-headline-md text-on-surface mb-2 max-w-sm truncate">{doc.name}</h4>
                                 <p className="text-body-md text-on-surface-variant mb-6">Cannot preview this file type directly.</p>
                                 <a href={doc.fileData} download={doc.name} className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-medium shadow-sm hover:opacity-90 transition-opacity">Download File</a>
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })()}
              </div>
           )}

        </div>
      )}

      {/* Create Node Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-on-background/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleCreateFileNode} className="bg-surface border border-outline-variant/30 rounded-xl shadow-2xl w-full max-w-sm p-6 relative">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer"><X size={20}/></button>
            <h2 className="text-headline-md font-headline-md text-on-surface mb-6">Create New</h2>
            
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-surface-container rounded-lg">
                <button type="button" onClick={() => setNewTypeType('folder')} className={`flex-1 py-1.5 rounded-md text-label-sm font-medium transition-colors cursor-pointer ${newTypeType === 'folder' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>Folder</button>
                <button type="button" onClick={() => setNewTypeType('file')} className={`flex-1 py-1.5 rounded-md text-label-sm font-medium transition-colors cursor-pointer ${newTypeType === 'file' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>Document</button>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Name</label>
                <input autoFocus value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder={newTypeType === 'folder' ? 'e.g. Assets' : 'e.g. Q3 Requirements'} className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary transition-colors" required />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-lg text-body-md font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-body-md font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer shadow-sm">Create</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
