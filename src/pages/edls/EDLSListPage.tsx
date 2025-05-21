import React from 'react';
import { useEDLSStore } from '../../store/edls-store';
import { EDLSItem } from '../../types';
import { DeepseekAnalysisResult } from '../../services/deepseek';

export default function EDLSListPage() {
  const edlsList = useEDLSStore(state => state.edlsList);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [dom, setDom] = React.useState("");
  const [th, setTh] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  // --- Ajout pour la modale d'assignation ---
  const [assignModalOpen, setAssignModalOpen] = React.useState<string|null>(null); // id EDLS
  const [selectedUser, setSelectedUser] = React.useState<string>("");
  const users = [
    { id: 'admin', label: 'Administrateur' },
    { id: 'user1', label: 'Utilisateur 1' },
    { id: 'user2', label: 'Utilisateur 2' },
  ];
  const handleAssign = () => {
    if (assignModalOpen && selectedUser) {
      useEDLSStore.getState().updateEDLS(assignModalOpen, {
        assignedTo: [selectedUser],
      });
      setAssignModalOpen(null);
      setSelectedUser("");
    }
  }

  // Génère les options uniques à partir des données existantes
  const categories = Array.from(new Set(edlsList.map(e => e.classification.category).filter(Boolean)));
  const statuses = Array.from(new Set(edlsList.map(e => e.status)));
  const doms = Array.from(new Set(edlsList.map(e => e.classification.dom).filter(Boolean)));
  const ths = Array.from(new Set(edlsList.map(e => e.classification.th).filter(Boolean)));

  // Filtrage combiné
  const filteredList = edlsList.filter(item => {
    const matchesSearch =
      search === "" ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.classification.sujet && item.classification.sujet.toLowerCase().includes(search.toLowerCase())) ||
      (item.content && item.content.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === "" || item.classification.category === category;
    const matchesStatus = status === "" || item.status === status;
    const matchesDom = dom === "" || item.classification.dom === dom;
    const matchesTh = th === "" || item.classification.th === th;
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(item.createdAt) >= new Date(dateFrom);
    }
    if (dateTo) {
      matchesDate = matchesDate && new Date(item.createdAt) <= new Date(dateTo);
    }
    return matchesSearch && matchesCategory && matchesStatus && matchesDom && matchesTh && matchesDate;
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Liste des EDLS</h1>
      {/* Filtres */}
      <div className="bg-neutral-50 rounded-lg border p-4 mb-6">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="search" className="block text-xs font-medium mb-1">Recherche</label>
            <input
              id="search"
              type="text"
              placeholder="Titre ou sujet..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-xs font-medium mb-1">Catégorie</label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="">Toutes</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-xs font-medium mb-1">Statut</label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="">Tous</option>
              {statuses.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dom" className="block text-xs font-medium mb-1">Domaine</label>
            <select
              id="dom"
              value={dom}
              onChange={e => setDom(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="">Tous</option>
              {doms.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="th" className="block text-xs font-medium mb-1">Thématique</label>
            <select
              id="th"
              value={th}
              onChange={e => setTh(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="">Toutes</option>
              {ths.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dateFrom" className="block text-xs font-medium mb-1">Date min</label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-xs font-medium mb-1">Date max</label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div className="flex justify-end md:col-span-4">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("");
                setStatus("");
                setDom("");
                setTh("");
                setDateFrom("");
                setDateTo("");
              }}
              className="border px-3 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#666" strokeWidth="2" d="M4 4l16 16M20 4L4 20"/></svg>
              Réinitialiser les filtres
            </button>
          </div>
        </form>
      </div>
      {filteredList.length === 0 ? (
        <div className="text-neutral-600">Aucun EDLS ne correspond à la recherche/filtre.</div>
      ) : (
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border p-2">Titre</th>
              <th className="border p-2">Catégorie</th>
              <th className="border p-2">Domaine</th>
              <th className="border p-2">Thématique</th>
              <th className="border p-2">Sujet</th>
              <th className="border p-2">Type Média</th>
              <th className="border p-2">Statut</th>
              <th className="border p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((item: EDLSItem) => (
              <React.Fragment key={item.id}>
                <tr className="hover:bg-neutral-50">
                  <td className="border p-2 font-semibold">{item.title}</td>
                  <td className="border p-2">{item.classification.category}</td>
                  <td className="border p-2">{item.classification.dom || '-'}</td>
                  <td className="border p-2">{item.classification.th || '-'}</td>
                  <td className="border p-2">{item.classification.sujet || '-'}</td>
                  <td className="border p-2">{item.classification.mediaType}</td>
                  <td className="border p-2">{item.status}</td>
                  <td className="border p-2">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="border p-2">
                    <button
                      className="text-blue-600 underline mr-2"
                      onClick={() => window.location.href = `/edls/edit/${item.id}`}
                    >
                      Modifier
                    </button>
                    <button
                      className="text-red-600 underline"
                      onClick={() => {
                        if(window.confirm('Supprimer cet EDLS ?')) {
                          useEDLSStore.getState().deleteEDLS(item.id);
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
                <tr>
                  <td colSpan={9} className="border p-2 bg-neutral-50">
                    {/* Aperçu fichier uploadé */}
                    {item.mediaFile && (
                      <div className="mb-2">
                        <span className="font-medium">Fichier :</span>{' '}
                        <a
                          href={item.mediaFile.data}
                          download={item.mediaFile.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {item.mediaFile.name}
                        </a>
                        {item.mediaFile.type.startsWith('image/') && (
                          <div className="mt-2">
                            <img src={item.mediaFile.data} alt="aperçu" className="max-h-32 border rounded" />
                          </div>
                        )}
                      </div>
                    )}
                    {/* Résultat IA */}
                    {item.aiAnalysis && (
                      <div className="space-y-1 mb-2">
                        <div><span className="font-medium">Résumé IA :</span> {item.aiAnalysis.summary}</div>
                        <div><span className="font-medium">Points clés :</span> {item.aiAnalysis.keyPoints?.join(' | ')}</div>
                        {Array.isArray((item.aiAnalysis as DeepseekAnalysisResult).negativePoints) && (
                          <div><span className="font-medium">Points négatifs :</span> {(item.aiAnalysis as DeepseekAnalysisResult).negativePoints?.join(' | ')}</div>
                        )}
                        <div><span className="font-medium">Sentiment :</span> {item.aiAnalysis.sentiment}</div>
                        <div><span className="font-medium">Suggestions :</span> {item.aiAnalysis.suggestedResponses?.join(' | ')}</div>
                      </div>
                    )}
                    {/* Validation humaine & Actions */}
                    <div className="flex flex-wrap gap-2 items-center mt-2">
                      {/* Générer une réponse IA */}
                      <button
                        className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 rounded text-indigo-700 text-sm"
                        onClick={() => {
                          window.location.href = `/responses/new?edlsId=${item.id}`;
                        }}
                      >
                        Générer réponse IA
                      </button>
                      {/* Assigner */}
                      <button
                        className="px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded text-amber-700 text-sm"
                        onClick={() => {
                          setAssignModalOpen(item.id);
                          setSelectedUser("");
                        }}
                      >
                        Assigner
                      </button>
                      {/* Valider suggestion IA */}
                      {!item.humanValidated ? (
                        <button
                          className="px-2 py-1 bg-green-100 hover:bg-green-200 rounded text-green-700 text-sm"
                          onClick={() => {
                            useEDLSStore.getState().updateEDLS(item.id, {
                              humanValidated: true,
                              validatedBy: 'admin', // À remplacer par l’utilisateur courant
                              validationComment: 'Validé depuis la liste',
                              status: 'responded',
                            });
                          }}
                        >
                          Valider suggestion IA
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          ✔ Validé par humain
                        </span>
                      )}
                      {/* Archiver */}
                      {item.status !== 'archived' && (
                        <button
                          className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 text-sm"
                          onClick={() => useEDLSStore.getState().updateEDLS(item.id, { status: 'archived' })}
                        >
                          Archiver
                        </button>
                      )}
                    </div>
                    {/* Commentaire de validation */}
                    {item.humanValidated && item.validationComment && (
                      <div className="text-xs text-green-700 mt-1">Commentaire : {item.validationComment}</div>
                    )}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
      {/* Modale d'assignation */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-xs">
            <h2 className="text-lg font-semibold mb-4">Assigner l'EDLS</h2>
            <select
              className="border rounded px-2 py-1 w-full mb-4"
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
            >
              <option value="">Sélectionner un utilisateur</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1 rounded bg-neutral-200 hover:bg-neutral-300"
                onClick={() => setAssignModalOpen(null)}
              >Annuler</button>
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={!selectedUser}
                onClick={handleAssign}
              >Assigner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
