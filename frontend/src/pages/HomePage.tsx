import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto my-8 max-w-3xl p-6 text-center font-[var(--font-primary)] sm:p-8">
      <header>
        <h1 className="mb-4 text-5xl font-bold text-pink-500 sm:text-6xl">
          Atlas of Worlds
        </h1>
        <p className="mb-8 text-xl text-pink-700 sm:text-2xl">
          Your Ultimate Companion for Crafting and Managing Fictional Universes.
        </p>
      </header>

      <section className="mb-10 text-left">
        <h2 className="border--pink-200 mb-3 border-b-2 pb-1 text-3xl font-semibold text-red-600">
          Weave Your Narratives with Precision
        </h2>
        <p className="text-lg leading-relaxed text-pink-800">
          Atlas of Worlds is a dedicated tool designed for Game Masters,
          writers, and creators who aspire to build rich, interconnected
          fictional worlds. Whether you're sketching out the initial concepts of
          a new realm or managing the intricate lore of an established universe,
          our platform provides the flexibility and power you need.
        </p>
      </section>

      <section className="mb-10 text-left">
        <h2 className="border--pink-200 mb-3 border-b-2 pb-1 text-3xl font-semibold text-red-600">
          Key Features
        </h2>
        <ul className="list-square space-y-2 pl-5 text-lg text-pink-800">
          <li>
            <strong className="font-semibold text-red-700">
              Rich Entry Creation:
            </strong>{' '}
            Detail everything from characters and locations to factions, items,
            events, and abstract concepts.
          </li>
          <li>
            <strong className="font-semibold text-red-700">
              Intuitive Interlinking:
            </strong>{' '}
            Visually and logically connect your world's elements to build a
            comprehensive web of lore.
          </li>
          <li>
            <strong className="font-semibold text-red-700">
              Customizable Templates:
            </strong>{' '}
            (Coming Soon!) Tailor entry types with specific fields to fit your
            unique worldbuilding style.
          </li>
          <li>
            <strong className="font-semibold text-red-700">
              Powerful Search & Filtering:
            </strong>{' '}
            Quickly find the information you need, when you need it.
          </li>
          <li>
            <strong className="font-semibold text-red-700">
              Rich Text Editing:
            </strong>{' '}
            Bring your descriptions and histories to life with an integrated
            text editor.
          </li>
          <li>
            <strong className="font-semibold text-red-700">
              Graph-Powered Backend:
            </strong>{' '}
            Leverages the strength of Neo4j to manage complex relationships
            efficiently.
          </li>
        </ul>
      </section>

      <section className="mb-10 text-left">
        <h2 className="border--pink-200 mb-3 border-b-2 pb-1 text-3xl font-semibold text-red-600">
          Why Choose Atlas of Worlds?
        </h2>
        <p className="text-lg leading-relaxed text-pink-800">
          Traditional note-taking apps and documents can quickly become
          disorganized when dealing with the depth of a fictional world. Atlas
          of Worlds offers a structured yet flexible approach, allowing your
          creativity to flourish without getting lost in a sea of disconnected
          information. Focus on building, we'll help you connect the dots.
        </p>
      </section>

      <section className="mt-12 text-center">
        {!isAuthenticated ? (
          <>
            <p className="mb-4 text-xl text-pink-700">
              Ready to start building your universe?
            </p>
            <Link
              to="/login"
              className="bg--pink-500 hover:bg--pink-600 mx-2 inline-block rounded px-6 py-3 text-lg font-semibold text-black transition-colors duration-300"
            >
              Login
            </Link>
            <span className="mx-2 text-xl text-pink-400">or</span>
            <Link
              to="/login"
              className="bg--red-500 hover:bg--red-600 mx-2 inline-block rounded px-6 py-3 text-lg font-semibold text-black transition-colors duration-300"
            >
              Sign Up
            </Link>
          </>
        ) : (
          <>
            <p className="mb-4 text-xl text-pink-700">
              Continue building your worlds!
            </p>
            <Link
              to="/my-worlds"
              className="bg--pink-500 hover:bg--pink-600 inline-block rounded px-6 py-3 text-lg font-semibold text-white transition-colors duration-300"
            >
              Go to My Worlds
            </Link>
          </>
        )}
      </section>
    </div>
  );
};

export default HomePage;
