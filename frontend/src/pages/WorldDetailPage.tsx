import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../services/api';
import axios from 'axios';

import { WorldDto } from '../../../backend/src/worlds/dto/world.dto';
import { CharacterDto } from '../../../backend/src/characters/dto/character.dto';
import { LocationDto } from '../../../backend/src/locations/dto/location.dto';
// You would also import DTOs for Faction, Item, Event, Concept, DateEntry as you add them

const WorldDetailPage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const [world, setWorld] = useState<WorldDto | null>(null);
  const [characters, setCharacters] = useState<CharacterDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  // Add more state for other entity types:
  // const [factions, setFactions] = useState<FactionDto[]>([]);
  // const [items, setItems] = useState<ItemDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!worldId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const worldResponse = await apiClient.get<WorldDto>(
          `/worlds/${worldId}`,
        );
        setWorld(worldResponse.data);
        const charactersResponse = await apiClient.get<CharacterDto[]>(
          `/characters/world/${worldId}`,
        );
        setCharacters(charactersResponse.data);

        const locationsResponse = await apiClient.get<LocationDto[]>(
          `/locations/world/${worldId}`,
        );
        setLocations(locationsResponse.data);

        // TODO: Fetch other related entities (Factions, Items, Events, Concepts, DateEntries)
      } catch (err: unknown) {
        let errorMessage = 'Failed to fetch world details.';
        if (axios.isAxiosError(err)) {
          if (err.response && err.response.status === 404) {
            errorMessage = `World with ID ${worldId} not found or you do not have permission to view it.`;
          } else if (
            err.response &&
            err.response.data &&
            typeof err.response.data.message === 'string'
          ) {
            errorMessage = err.response.data.message;
          } else if (typeof err.message === 'string') {
            errorMessage = err.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        console.error('Fetch world detail error:', err);
        setWorld(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [worldId]);

  if (isLoading) return <p>Loading world details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!world) return <p>World not found.</p>;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <header className="mb-6 border-b border-pink-200 pb-4">
        <h1 className="text-4xl font-bold text-pink-500">{world.name}</h1>
        <p className="text-lg text-gray-600">
          {world.description || 'No description provided.'}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Default Money System: {world.defaultMoneySystem || 'N/A'}
        </p>
        {world.owner && (
          <p className="text-sm text-gray-500">Owner: {world.owner.username}</p>
        )}
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-red-600">Characters</h2>
        {characters.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {characters.map((char) => (
              <li key={char.id}>
                {char.name} {/* TODO: Link to character detail page */}
                {char.description && (
                  <span className="ml-2 text-sm text-gray-500">
                    - {char.description.substring(0, 50)}...
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No characters yet in this world.</p>
        )}
        {/* TODO: Add Link to create new character for this world */}
        {/* <Link to={`/worlds/${worldId}/characters/create`}>Add Character</Link> */}
      </section>

      {/* Locations Section */}
      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-red-600">Locations</h2>
        {locations.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {locations.map((loc) => (
              <li key={loc.id}>
                {loc.name} {/* TODO: Link to location detail page */}
                {loc.type && (
                  <span className="ml-2 text-sm text-gray-400">
                    ({loc.type})
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No locations yet in this world.</p>
        )}
        {/* TODO: Add Link to create new location for this world */}
      </section>

      {/* TODO: Add sections for Factions, Items, Events, Concepts, DateEntries */}

      {/* TODO: Add UI for creating/viewing relationships originating from this World (if any direct ones) */}
      {/* Or, more commonly, relationships will be managed from the individual entity detail pages (e.g., Character X MEMBER_OF Faction Y) */}
    </div>
  );
};

export default WorldDetailPage;
