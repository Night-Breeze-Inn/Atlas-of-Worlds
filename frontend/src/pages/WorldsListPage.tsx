import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import axios from 'axios';
import { WorldDto } from '../../../backend/src/worlds/dto/world.dto';

const WorldsListPage: React.FC = () => {
  const [worlds, setWorlds] = useState<WorldDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorlds = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<WorldDto[]>('/worlds/owner/me');
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
      <Link to="/worlds/create">Create New World</Link>
      {worlds.length === 0 ? (
        <p>You haven't created any worlds yet.</p>
      ) : (
        <ul>
          {worlds.map((world) => (
            <li key={world.id}>
              <h3>{world.name}</h3>
              <p>{world.description || 'No description.'}</p>
              <p><small>Money System: {world.defaultMoneySystem || 'N/A'}</small></p>
              {world.owner && <p><small>Owner: {world.owner.username}</small></p>}
            </li>
          ))}
        </ul>
      )}
      {/* <Link to="/worlds/create">Create New World</Link> */}
    </div>
  );
};

export default WorldsListPage;