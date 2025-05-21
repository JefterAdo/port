import React from 'react';
import { ExternalLink } from 'lucide-react';

interface SearchResultsProps {
  results?: {
    documents: string[];
    ids: string[];
    distances?: number[];
  };
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (!results || !results.documents.length) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      <h3 className="text-lg font-medium mb-4">Résultats de recherche</h3>
      
      <div className="space-y-4">
        {results.documents.map((doc, index) => (
          <div 
            key={results.ids[index]} 
            className="p-4 bg-white rounded-lg border border-neutral-200 shadow-sm hover:shadow transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-primary">Document #{results.ids[index]}</h4>
              {results.distances && (
                <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                  Score: {(1 - results.distances[index]).toFixed(2)}
                </span>
              )}
            </div>
            
            <p className="text-neutral-700 text-sm mb-3">{doc}</p>
            
            <div className="flex justify-end">
              <button className="inline-flex items-center text-xs text-primary hover:underline">
                <ExternalLink className="h-3 w-3 mr-1" />
                Voir le document complet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
