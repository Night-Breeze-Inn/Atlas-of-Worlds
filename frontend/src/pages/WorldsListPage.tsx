import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import axios from 'axios';
// You'll need a DTO for World from your backend, e.g., WorldDto
// For now, let's assume a simple structure
// import { WorldDto } from '../../../backend/src/worlds/dto/world.dto'; // Adjust path

interface SimpleWorld {
  id: string;
  name: string;
  description?: string;
}

const WorldsListPage: React.FC = () => {
  const [worlds, setWorlds] = useState<SimpleWorld[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorlds = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<SimpleWorld[]>('/worlds/owner/me');
        setWorlds(response.data);
      } catch (err: unknown) {
        let errorMessage = 'Failed to fetch worlds.';
         if (axios.isAxiosError(err)) { 
           if (err.response && err.response.data && typeof err.response.data.message === 'string') {
             errorMessage = err.response.data.message;
           } else if (typeof err.message === 'string') {
              errorMessage = err.message;
           }
         } else if (err instanceof Error) {
           errorMessage = err.message;
         }
        setError(errorMessage);
        console.error("Fetch worlds error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorlds();
  }, []);

  if (isLoading) return <p>Loading worlds...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2>My Worlds</h2>
      {worlds.length === 0 ? (
        <p>You haven't created any worlds yet.</p>
      ) : (
        <ul>
          {worlds.map((world) => (
            <li key={world.id}>
              <h3>{world.name}</h3>
              <p>{world.description || 'No description.'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WorldsListPage;