import React from "react";

interface ForcesFaiblessesSectionProps {
  title: string;
  description?: string;
  onFileChange: (files: FileList | null) => void;
  contentValue: string;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  contentName: string;
  btnLabel: string;
  bgColor: string;
}

const ForcesFaiblessesSection: React.FC<ForcesFaiblessesSectionProps> = ({
  title,
  description,
  onFileChange,
  contentValue,
  onContentChange,
  contentName,
  btnLabel,
  bgColor
}) => {
  return (
    <div className={`p-4 mb-6 rounded-md ${bgColor}`}>
      <h3 className="font-bold text-md mb-2">{title}</h3>
      {description && <p className="text-sm mb-3">{description}</p>}
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Type de média</label>
          <select className="w-full border rounded p-1.5">
            <option value="texte">Texte</option>
            <option value="image">Image</option>
            <option value="video">Vidéo</option>
            <option value="audio">Audio</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Fichier média (optionnel)</label>
          <input 
            type="file" 
            className="w-full border rounded p-1.5"
            onChange={(e) => onFileChange(e.target.files)}
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">CONTENU / RÉSUMÉ</label>
          <textarea
            name={contentName}
            value={contentValue}
            onChange={onContentChange}
            className="w-full border rounded p-1.5 h-20"
          ></textarea>
        </div>
        
        <div className="flex justify-start">
          <button
            type="button"
            className="bg-yellow-400 text-black px-4 py-1 rounded hover:bg-yellow-500"
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForcesFaiblessesSection;
