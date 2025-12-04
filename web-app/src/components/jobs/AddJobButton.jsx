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
        className="btn btn-primary gap-2"
      >
        <Plus size={20} />
        Add New Job
      </button>

      {isOpen && <AddJobModal onClose={() => setIsOpen(false)} />}
    </>
  );
}