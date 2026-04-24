"use client";
import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export function DocumentEditor({ content, onChange }: { content: string, onChange: (val: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      })
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm xl:prose-base focus:outline-none min-h-[300px] w-full max-w-none text-on-surface'
      }
    }
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-surface border border-outline-variant/30 rounded-xl overflow-hidden ambient-shadow">
      <div className="bg-surface-container flex items-center gap-1 p-2 border-b border-outline-variant/30">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-label-sm font-label-sm font-bold ${editor.isActive('bold') ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-label-sm font-label-sm italic ${editor.isActive('italic') ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded text-label-sm font-label-sm line-through ${editor.isActive('strike') ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
        >
          S
        </button>
        <div className="w-px h-4 bg-outline-variant/50 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-label-sm font-label-sm font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-label-sm font-label-sm flex items-center justify-center ${editor.isActive('bulletList') ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
        >
          • List
        </button>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
