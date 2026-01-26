"use client";

import { useState } from "react";
import CreateProjectModal from "./create-project-modal";

export default function PromoterHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="border-b border-white/10 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white flex items-center justify-center">
              <div className="grid grid-cols-2 gap-0.5 sm:gap-1 p-1 sm:p-1.5">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white"></div>
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                ESTUDIO.
              </h1>
              <p className="text-xs sm:text-sm text-white/70">
                GESTÃO DE EXPERIÊNCIAS
              </p>
            </div>
          </div>

          {/* Create Project Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm uppercase tracking-wide hover:bg-zinc-100 transition-colors border-2 border-black"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            CRIAR PROJETO
          </button>
        </div>
      </header>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
