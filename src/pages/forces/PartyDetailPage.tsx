import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ForcesFaiblessesForm from "../../components/forces/ForcesFaiblessesForm";

interface Party {
  id: string;
  nom: string;
  description: string;
  logo_url?: string;
}

interface StrengthWeakness {
  id: string;
  type: string;
  categorie?: string;
  contenu: string;
  resume?: string;
  date: string;
  source?: string;
  auteur?: string;
}

export default function PartyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [party, setParty] = useState<Party | null>(null);
  const [items, setItems] = useState<StrengthWeakness[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Charger les détails du parti
    fetch(`/parties/${id}`)
      .then(res => res.json())
      .then(setParty)
      .catch(err => {
        console.error("Erreur lors du chargement du parti:", err);
        toast.error("Erreur lors du chargement des détails du parti");
      });
    
    // Charger les forces et faiblesses
    fetch(`/forces-faiblesses/${id}`)
      .then(res => res.json())
      .then(setItems)
      .catch(err => {
        console.error("Erreur lors du chargement des forces/faiblesses:", err);
        toast.error("Erreur lors du chargement des forces et faiblesses");
      })
      .finally(() => setLoading(false));
  }, [id, refresh]);

  const handleFormSuccess = () => {
    setRefresh(r => r + 1);
  };

  const handleDelete = (sw_id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
      fetch(`/forces-faiblesses/${sw_id}`, { method: "DELETE" })
        .then(res => {
          if (!res.ok) throw new Error("Erreur lors de la suppression");
          toast.success("Élément supprimé avec succès");
          setRefresh(r => r + 1);
        })
        .catch(err => {
          console.error("Erreur lors de la suppression:", err);
          toast.error("Erreur lors de la suppression de l'élément");
        });
    }
  };

  // Formater le type pour l'affichage
  const formatType = (type: string): string => {
    const typeMap: Record<string, string> = {
      "force": "Force",
      "faiblesse": "Faiblesse",
      "environnement": "Environnement",
      "renforcement": "Élément de renforcement",
      "deconstruction": "Élément de déconstruction",
      "reponse": "Réponse",
      "autre": "Autre information"
    };
    return typeMap[type] || type;
  };

  // Déterminer la couleur en fonction du type
  const getTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      "force": "text-green-600",
      "faiblesse": "text-red-600",
      "environnement": "text-blue-600",
      "renforcement": "text-purple-600",
      "deconstruction": "text-orange-600",
      "reponse": "text-yellow-700",
      "autre": "text-gray-600"
    };
    return colorMap[type] || "text-gray-800";
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (!party) return <div className="text-center py-10 text-red-600">Parti non trouvé</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* En-tête avec logo et infos du parti */}
      <div className="flex items-center mb-8 bg-white p-4 rounded-lg shadow">
        {party.logo_url && (
          <img src={party.logo_url} alt={party.nom} className="w-24 h-24 object-contain mr-6" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{party.nom}</h1>
          <p className="text-gray-700 mt-2">{party.description}</p>
        </div>
      </div>

      {/* Nouveau formulaire complet */}
      <ForcesFaiblessesForm onSuccess={handleFormSuccess} />

      {/* Liste des éléments existants */}
      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-semibold mb-4">Éléments enregistrés</h2>
        
        {items.length === 0 ? (
          <p className="text-gray-500 italic text-center py-4">Aucun élément enregistré pour ce parti</p>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-md border-l-4 border-gray-300 hover:border-blue-500 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold ${getTypeColor(item.type)}`}>{formatType(item.type)}</span>
                      {item.categorie && <span className="text-gray-600 text-sm">| {item.categorie}</span>}
                    </div>
                    <p className="text-gray-800">{item.contenu}</p>
                    {item.resume && <p className="text-sm text-gray-600 mt-1">{item.resume}</p>}
                    <div className="mt-2 text-xs flex flex-wrap gap-3">
                      <span className="text-gray-500">Date: {new Date(item.date).toLocaleDateString('fr-FR')}</span>
                      {item.source && <span className="text-blue-600">Source: {item.source}</span>}
                      {item.auteur && <span className="text-gray-600">Par: {item.auteur}</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="text-red-500 hover:text-red-700 transition p-1 rounded-full hover:bg-red-100"
                    title="Supprimer cet élément"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                      <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
