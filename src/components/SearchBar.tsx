import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Button from './ui/Button';
import ragService from '../services/ragService';

interface SearchBarProps {
  onResultsFound?: (results: { documents: string[]; ids: string[] }) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onResultsFound }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await ragService.search(query);
      if (onResultsFound) {
        onResultsFound(results);
      }
    } catch (err) {
      setError('Erreur lors de la recherche. Le backend RAG est-il accessible?');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-3xl mx-auto">
      <div className="relative">
        <input
          type="text"
          placeholder="Recherche contextuelle..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-4 pr-12 rounded-lg border border-neutral-300 focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={isLoading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
        >
          <Search className={`h-5 w-5 ${isLoading ? 'text-neutral-400 animate-pulse' : 'text-neutral-600'}`} />
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </form>
  );
};

export default SearchBar;
