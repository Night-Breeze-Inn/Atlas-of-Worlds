import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import axios from 'axios';
import type { CreateWorldDto, WorldDto } from '@atlas-of-worlds/types';

type FrontendCreateWorldDto = Omit<CreateWorldDto, 'ownerId'>;

const CreateWorldPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultMoneySystem, setDefaultMoneySystem] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const worldData: FrontendCreateWorldDto = {
      name,
      description: description || undefined,
      defaultMoneySystem: defaultMoneySystem || undefined,
    };

    try {
      const response = await apiClient.post<WorldDto>('/worlds', worldData);

      console.log('World created:', response.data);
      navigate('/');
    } catch (err: unknown) {
      let errorMessage = 'Failed to create world.';
      if (axios.isAxiosError(err)) {
        if (
          err.response &&
          err.response.data &&
          typeof err.response.data.message === 'string'
        ) {
          errorMessage = err.response.data.message;
        } else if (Array.isArray(err.response?.data?.message)) {
          errorMessage = err.response.data.message.join(', ');
        } else if (typeof err.message === 'string') {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Create world error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New World</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">World Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="description">Description (Optional):</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>
        <div>
          <label htmlFor="defaultMoneySystem">
            Default Money System (Optional):
          </label>
          <input
            type="text"
            id="defaultMoneySystem"
            value={defaultMoneySystem}
            onChange={(e) => setDefaultMoneySystem(e.target.value)}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create World'}
        </button>
      </form>
    </div>
  );
};

export default CreateWorldPage;
