import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/api';
import axios from 'axios';

import type {
  WorldDto,
  CharacterDto,
  LocationDto,
  FactionDto,
  ItemDto,
  EventDto,
  ConceptDto,
  DateEntryDto,
} from '@atlas-of-worlds/types';

const WorldDetailPage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const [world, setWorld] = useState<WorldDto | null>(null);
  const [characters, setCharacters] = useState<CharacterDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [concepts, setConcepts] = useState<ConceptDto[]>([]);
  const [dateEntries, setDateEntries] = useState<DateEntryDto[]>([]);
  const [factions, setFactions] = useState<FactionDto[]>([]);
  const [items, setItems] = useState<ItemDto[]>([]);

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

        const factionsResponse = await apiClient.get<FactionDto[]>(
          `/factions/world/${worldId}`,
        );
        setFactions(factionsResponse.data);

        const itemsResponse = await apiClient.get<ItemDto[]>(
          `/items/world/${worldId}`,
        );
        setItems(itemsResponse.data);

        const eventsResponse = await apiClient.get<EventDto[]>(
          `/events/world/${worldId}`,
        );
        setEvents(eventsResponse.data);

        const conceptsResponse = await apiClient.get<ConceptDto[]>(
          `/concepts/world/${worldId}`,
        );
        setConcepts(conceptsResponse.data);

        const dateEntriesResponse = await apiClient.get<DateEntryDto[]>(
          `/date-entries/world/${worldId}`,
        );
        setDateEntries(dateEntriesResponse.data);
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

      {/* Characters Section */}
      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-red-600">Characters</h2>
        {characters.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {characters.map((char) => (
              <li key={char.id}>
                <a
                  href={`/characters/${char.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {char.name}
                </a>
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
        <Link
          to={`/worlds/${worldId}/characters/create`}
          className="mt-2 inline-block rounded bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600"
        >
          Add Character
        </Link>
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
      </section>

      {/* Factions Section */}
      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-red-600">Factions</h2>
        {factions.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {factions.map((faction) => (
              <li key={faction.id}>
                <a
                  href={`/factions/${faction.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {faction.name}
                </a>
                {faction.description && (
                  <span className="ml-2 text-sm text-gray-500">
                    - {faction.description.substring(0, 50)}...
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No factions yet in this world.</p>
        )}
        <Link
          to={`/worlds/${worldId}/factions/create`}
          className="mt-2 inline-block rounded bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600"
        >
          Add Faction
        </Link>
      </section>

      {/* Items Section */}
      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-red-600">Items</h2>
        {items.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`/items/${item.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {item.name}
                </a>
                {item.description && (
                  <span className="ml-2 text-sm text-gray-500">
                    - {item.description.substring(0, 50)}...
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No items yet in this world.</p>
        )}
        <Link
          to={`/worlds/${worldId}/items/create`}
          className="mt-2 inline-block rounded bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600"
        >
          Add Item
        </Link>
      </section>

      {/* Events Section */}
      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-red-600">Events</h2>
        {events.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {events.map((event) => (
              <li key={event.id}>
                <a
                  href={`/events/${event.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {event.name}
                </a>
                {event.description && (
                  <span className="ml-2 text-sm text-gray-500">
                    - {event.description.substring(0, 50)}...
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No events yet in this world.</p>
        )}
        <Link
          to={`/worlds/${worldId}/events/create`}
          className="mt-2 inline-block rounded bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600"
        >
          Add Event
        </Link>
      </section>

      {/* Concepts Section */}
      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-red-600">Concepts</h2>
        {concepts.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {concepts.map((concept) => (
              <li key={concept.id}>
                <a
                  href={`/concepts/${concept.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {concept.name}
                </a>
                {concept.description && (
                  <span className="ml-2 text-sm text-gray-500">
                    - {concept.description.substring(0, 50)}...
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No concepts yet in this world.</p>
        )}
        <Link
          to={`/worlds/${worldId}/concepts/create`}
          className="mt-2 inline-block rounded bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600"
        >
          Add Concept
        </Link>
      </section>

      {/* Date Entries Section */}
      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-red-600">
          Date Entries
        </h2>
        {dateEntries.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {dateEntries.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`/date-entries/${entry.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {entry.name}
                </a>
                {entry.description && (
                  <span className="ml-2 text-sm text-gray-500">
                    - {entry.description.substring(0, 50)}...
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No date entries yet in this world.</p>
        )}
        <Link
          to={`/worlds/${worldId}/date-entries/create`}
          className="mt-2 inline-block rounded bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600"
        >
          Add Date Entry
        </Link>
      </section>
    </div>
  );
};

export default WorldDetailPage;
