import React, { useState } from "react";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";
import ForcesFaiblessesSection from "./ForcesFaiblessesSection";

// Types d'éléments conformes au backend
type ElementType = 
  | "force" 
  | "faiblesse" 
  | "environnement" 
  | "renforcement" 
  | "deconstruction" 
  | "reponse" 
  | "autre";

interface FormData {
  // Section principale
  party_id: string;
  type: "force" | "faiblesse";
  categorie: string;
  domaine: string;
  thematique: string;
  sujet: string;
  
  // Environnement
  environnement_medias: File[];
  environnement_contenu: string;
  
  // Renforcement
  renforcement_medias: File[];
  renforcement_contenu: string;
  
  // Déconstruction
  deconstruction_medias: File[];
  deconstruction_contenu: string;
  
  // Autres informations
  autres_medias: File[];
  autres_contenu: string;
  
  // Réponse
  reponse_medias: File[];
  reponse_contenu: string;
}

export default function ForcesFaiblessesForm({ onSuccess }: { onSuccess: () => void }) {
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // État initial du formulaire
  const initialFormData: FormData = {
    party_id: id || "",
    type: "force",
    categorie: "",
    domaine: "",
    thematique: "",
    sujet: "",
    environnement_medias: [],
    environnement_contenu: "",
    renforcement_medias: [],
    renforcement_contenu: "",
    deconstruction_medias: [],
    deconstruction_contenu: "",
    autres_medias: [],
    autres_contenu: "",
    reponse_medias: [],
    reponse_contenu: ""
  };
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  
  // Gérer les changements de formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Gérer les changements de fichiers
  const handleFileChange = (section: string, files: FileList | null) => {
    if (!files) return;
    
    const fieldName = `${section}_medias`;
    const filesArray = Array.from(files);
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...filesArray]
    }));
  };
  
  const submitElement = async (type: ElementType, contenu: string, resume: string) => {
    try {
      // 1. Créer l'élément de base
      const elementRes = await fetch("/forces-faiblesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          party_id: formData.party_id,
          type,
          categorie: formData.categorie,
          contenu,
          resume,
          date_: new Date().toISOString().split('T')[0], // Date du jour au format YYYY-MM-DD
          source: "",
          auteur: ""
        }),
      });
      
      if (!elementRes.ok) throw new Error("Erreur lors de la création de l'élément");
      
      const element = await elementRes.json();
      
      // 2. Ajouter les médias si présents
      const mediaFieldName = `${type}_medias`;
      const mediaFiles = formData[mediaFieldName as keyof FormData];
      
      if (Array.isArray(mediaFiles) && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const formData = new FormData();
          formData.append("element_id", element.id);
          formData.append("media_type", file.type.startsWith("image") ? "image" : 
                                        file.type.startsWith("video") ? "video" : 
                                        file.type.startsWith("audio") ? "audio" : "autre");
          formData.append("importance", "3");
          formData.append("file", file);
          
          await fetch("/media-files", {
            method: "POST",
            body: formData,
          });
        }
      }
      
      return element;
    } catch (error) {
      console.error(`Erreur lors de la soumission de l'élément ${type}:`, error);
      throw error;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validation de base
      if (!formData.categorie || !formData.sujet) {
        toast.error("Veuillez remplir les champs obligatoires");
        setIsSubmitting(false);
        return;
      }
      
      // 1. Créer l'élément principal (force ou faiblesse)
      await submitElement(
        formData.type,
        formData.sujet,
        `${formData.domaine} - ${formData.thematique}`
      );
      
      // 2. Créer l'élément environnement si renseigné
      if (formData.environnement_contenu.trim()) {
        await submitElement(
          "environnement",
          formData.environnement_contenu,
          `Environnement de ${formData.type === 'force' ? 'la force' : 'la faiblesse'}: ${formData.sujet}`
        );
      }
      
      // 3. Créer l'élément renforcement si renseigné
      if (formData.renforcement_contenu.trim()) {
        await submitElement(
          "renforcement",
          formData.renforcement_contenu,
          `Renforcement de ${formData.type === 'force' ? 'la force' : 'la faiblesse'}: ${formData.sujet}`
        );
      }
      
      // 4. Créer l'élément déconstruction si renseigné
      if (formData.deconstruction_contenu.trim()) {
        await submitElement(
          "deconstruction",
          formData.deconstruction_contenu,
          `Déconstruction de ${formData.type === 'force' ? 'la force' : 'la faiblesse'}: ${formData.sujet}`
        );
      }
      
      // 5. Créer l'élément autres informations si renseigné
      if (formData.autres_contenu.trim()) {
        await submitElement(
          "autre",
          formData.autres_contenu,
          `Autres informations sur ${formData.type === 'force' ? 'la force' : 'la faiblesse'}: ${formData.sujet}`
        );
      }
      
      // 6. Créer l'élément réponse si renseigné
      if (formData.reponse_contenu.trim()) {
        await submitElement(
          "reponse",
          formData.reponse_contenu,
          `Réponse à ${formData.type === 'force' ? 'la force' : 'la faiblesse'}: ${formData.sujet}`
        );
      }
      
      // Réinitialiser le formulaire
      setFormData(initialFormData);
      setFormData(prev => ({ ...initialFormData, party_id: prev.party_id, type: prev.type }));
      
      // Notification et rafraîchissement
      toast.success(`${formData.type === 'force' ? 'Force' : 'Faiblesse'} ajoutée avec succès`);
      onSuccess();
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'enregistrement");
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-2">Forces et Faiblesses</h2>
      
      <form onSubmit={handleSubmit} className="border border-dashed p-4 rounded-lg">
        {/* En-tête: sélection unifiée Force/Faiblesse */}
        <div className="border-b border-gray-300 pb-3 mb-3">
          <h3 className="text-md font-semibold mb-2">CRÉER UNE ENTITÉ</h3>
          <div className="mb-3">
            <label htmlFor="entity-type" className="block text-sm font-medium mb-1">Type</label>
            <select 
              id="entity-type"
              className="w-full border rounded p-1.5"
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as "force" | "faiblesse";
                setFormData(prev => ({ ...prev, type: newType }));
              }}
            >
              <option value="force">Force</option>
              <option value="faiblesse">Faiblesse</option>
            </select>
          </div>
        </div>

        {/* Section d'identification */}
        <div className="mb-6 border-b border-gray-300 pb-4">
          <h3 className="text-md font-semibold mb-2">Identification/Précision de la Force ou de la Faiblesse</h3>
          
          <div className="mb-3">
            <label htmlFor="categorie" className="block text-sm font-medium mb-1">Catégorie</label>
            <input
              type="text"
              id="categorie"
              name="categorie"
              className="w-full border rounded p-1.5"
              value={formData.categorie}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="domaine" className="block text-sm font-medium mb-1">Domaine (DOM)</label>
            <input
              type="text"
              id="domaine"
              name="domaine"
              className="w-full border rounded p-1.5"
              value={formData.domaine}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="thematique" className="block text-sm font-medium mb-1">Thématique (TH)</label>
            <input
              type="text"
              id="thematique"
              name="thematique"
              className="w-full border rounded p-1.5"
              value={formData.thematique}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="sujet" className="block text-sm font-medium mb-1">Sujet</label>
            <input
              type="text"
              id="sujet"
              name="sujet"
              className="w-full border rounded p-1.5"
              value={formData.sujet}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        {/* Environnement */}
        <ForcesFaiblessesSection
          title="ENVIRONNEMENT DE LA FORCE OU DE LA FAIBLESSE"
          description="ELEMENTS CONSTITUTIFS DE LA FORCE OU DE LA FAIBLESSE"
          onFileChange={(files) => handleFileChange("environnement", files)}
          contentValue={formData.environnement_contenu}
          onContentChange={(e) => handleInputChange(e)}
          contentName="environnement_contenu"
          btnLabel="Ajouter les données"
          bgColor="bg-green-100"
        />
        
        {/* Renforcement */}
        <ForcesFaiblessesSection
          title="ÉLÉMENTS SUSCEPTIBLES DE RENFORCER LA FORCE OU LA FAIBLESSE"
          onFileChange={(files) => handleFileChange("renforcement", files)}
          contentValue={formData.renforcement_contenu}
          onContentChange={(e) => handleInputChange(e)}
          contentName="renforcement_contenu"
          btnLabel="Ajouter l'élément"
          bgColor="bg-green-100"
        />
        
        {/* Déconstruction */}
        <ForcesFaiblessesSection
          title="ÉLÉMENTS SUSCEPTIBLES DE DÉCONSTRUIRE LA FORCE OU LA FAIBLESSE"
          onFileChange={(files) => handleFileChange("deconstruction", files)}
          contentValue={formData.deconstruction_contenu}
          onContentChange={(e) => handleInputChange(e)}
          contentName="deconstruction_contenu"
          btnLabel="Ajouter l'élément"
          bgColor="bg-green-100"
        />
        
        {/* Autres informations */}
        <ForcesFaiblessesSection
          title="AUTRES INFORMATIONS UTILES"
          onFileChange={(files) => handleFileChange("autres", files)}
          contentValue={formData.autres_contenu}
          onContentChange={(e) => handleInputChange(e)}
          contentName="autres_contenu"
          btnLabel="Ajouter l'élément"
          bgColor="bg-green-100"
        />
        
        {/* Réponse */}
        <ForcesFaiblessesSection
          title="RÉPONSE À LA FORCE OU À LA FAIBLESSE"
          onFileChange={(files) => handleFileChange("reponse", files)}
          contentValue={formData.reponse_contenu}
          onContentChange={(e) => handleInputChange(e)}
          contentName="reponse_contenu"
          btnLabel="Ajouter l'élément"
          bgColor="bg-orange-100"
        />
        
        {/* Bouton de soumission global */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Enregistrement..." : "Enregistrer l'analyse complète"}
          </button>
        </div>
      </form>
    </div>
  );
}
