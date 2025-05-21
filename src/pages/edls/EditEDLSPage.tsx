import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEDLSStore } from '../../store/edls-store';
import { EDLSItem } from '../../types';

export default function EditEDLSPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const edlsList = useEDLSStore(state => state.edlsList);
  const updateEDLS = useEDLSStore(state => state.updateEDLS);
  const edls = edlsList.find(e => e.id === id);

  const [form, setForm] = useState<EDLSItem | null>(edls ? { ...edls } : null);
  const [error, setError] = useState('');

  if (!form) {
    return <div className="max-w-2xl mx-auto p-6">EDLS introuvable.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      setError('Titre et contenu requis');
      return;
    }
    updateEDLS(form.id, {
      ...form,
      updatedAt: new Date().toISOString(),
    });
    navigate('/edls');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Modifier l'EDLS</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Titre</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Contenu</label>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            rows={6}
            required
          />
        </div>
        {/* Ajoute ici d'autres champs si besoin (catégorie, etc.) */}
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Sauvegarder
          </button>
          <button
            type="button"
            className="bg-neutral-200 text-neutral-700 px-4 py-2 rounded hover:bg-neutral-300"
            onClick={() => navigate('/edls')}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
