import React, { useState } from 'react';
import { useEDLSStore } from '../../store/edls-store';

import Button from '../../components/ui/Button';

const categories: string[] = [
  "EDLS_OFFICIEL",
  "PERSONNALISÉ",
  "PROPAGANDE",
  "VECTEUR_OPINION",
  "PROXIMITE",
  "PROJET_EDLS",
  "REMONTÉE_INFO",
  "SWOT"
];

const mediaTypes: string[] = ["text", "pdf", "docx", "image", "audio", "video"];

export default function NewEDLSPage() {
  const addEDLS = useEDLSStore(state => state.addEDLS);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("EDLS_OFFICIEL");
  const [dom, setDom] = useState("");
  const [th, setTh] = useState("");
  const [sujet, setSujet] = useState("");
  const [mediaType, setMediaType] = useState<string>("text");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let mediaFile = undefined;
    if (file) {
      // Lecture du fichier en base64
      mediaFile = await new Promise<{ name: string; type: string; data: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({ name: file.name, type: file.type, data: reader.result as string });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    const classification = {
      category,
      dom: dom || undefined,
      th: th || undefined,
      sujet: sujet || undefined,
      mediaType,
    };
    await addEDLS({
      title,
      classification,
      content,
      mediaUrl: file ? file.name : undefined,
      mediaFile,
      actions: [],
      assignedTo: [],
      status: 'new',
      aiAnalysis: undefined,
    });
    setTitle("");
    setContent("");
    setDom("");
    setTh("");
    setSujet("");
    setFile(null);
    setCategory("EDLS_OFFICIEL");
    setMediaType("text");
    setLoading(false);
    alert("EDLS ajouté et analysé !");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Nouveau EDLS</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block font-medium">Titre</label>
          <input
            className="border rounded w-full p-2"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium">Catégorie</label>
          <select
            className="border rounded w-full p-2"
            value={category}
            onChange={e => setCategory(e.target.value as EDLSCategory)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Domaine (DOM)</label>
          <input
            className="border rounded w-full p-2"
            value={dom}
            onChange={e => setDom(e.target.value)}
            placeholder="Ex: Communication, Sécurité..."
          />
        </div>
        <div>
          <label className="block font-medium">Thématique (TH)</label>
          <input
            className="border rounded w-full p-2"
            value={th}
            onChange={e => setTh(e.target.value)}
            placeholder="Ex: Emploi, Santé..."
          />
        </div>
        <div>
          <label className="block font-medium">Sujet</label>
          <input
            className="border rounded w-full p-2"
            value={sujet}
            onChange={e => setSujet(e.target.value)}
            placeholder="Sujet précis"
          />
        </div>
        <div>
          <label className="block font-medium">Type de média</label>
          <select
            className="border rounded w-full p-2"
            value={mediaType}
            onChange={e => setMediaType(e.target.value as MediaType)}
          >
            {mediaTypes.map(mt => (
              <option key={mt} value={mt}>{mt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Fichier média (optionnel)</label>
          <input
            type="file"
            onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
            accept=".pdf,.docx,.jpg,.jpeg,.png,.mp3,.wav,.mp4,.avi,.txt"
          />
        </div>
        <div>
          <label className="block font-medium">Contenu / Résumé</label>
          <textarea
            className="border rounded w-full p-2"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Analyse en cours..." : "Ajouter l'EDLS"}
        </Button>
      </form>
      {loading && (
        <div className="mt-4 text-blue-600">Analyse IA en cours, merci de patienter...</div>
      )}
    </div>
  );
}
