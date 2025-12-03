'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AddJobModal from './AddJobModal';

export default function AddJobButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
      >
        <Plus size={20} />
        <span>Add New Job</span>
      </button>

      {isOpen && <AddJobModal onClose={() => setIsOpen(false)} />}
    </>
  );
}