"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="w-full max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center z-10">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center border border-outline-variant/30 mb-8 shadow-sm">
          <div className="w-6 h-6 bg-primary rotate-45 rounded-sm" />
        </div>
        
        <h1 className="text-display-xl md:text-[64px] font-display-xl text-on-surface tracking-tight leading-tight max-w-4xl mb-6">
          Find your deep work.<br />
          <span className="text-outline">Build in peace.</span>
        </h1>
        
        <p className="text-body-lg md:text-xl font-body-lg text-on-surface-variant max-w-2xl mb-12">
          Trust & Peace is the quiet project management platform designed to remove the noise so your team can focus on what actually matters.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/register" className="px-8 py-3.5 bg-primary text-on-primary rounded-full font-label-sm text-label-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm cursor-pointer">
            Get Started <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="px-8 py-3.5 bg-surface-container-lowest border border-outline-variant/50 text-on-surface rounded-full font-label-sm text-label-sm hover:bg-surface-container-low transition-colors cursor-pointer ambient-shadow">
            Sign In
          </Link>
        </div>
        
        <div className="mt-20 flex gap-8 justify-center flex-wrap">
          <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
            <CheckCircle2 size={16} className="text-primary" /> Unified Kanban Boards
          </div>
          <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
            <CheckCircle2 size={16} className="text-primary" /> Integrated Documentation
          </div>
          <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
            <CheckCircle2 size={16} className="text-primary" /> Real-time Org Sync
          </div>
        </div>

      </div>
    </div>
  );
}
