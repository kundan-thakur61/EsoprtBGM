/* src/pages/HomePage.jsx */
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
    <h1 className="text-4xl font-bold mb-4">Welcome to EsportBGM</h1>
    <p className="text-lg text-gray-700 mb-6">
      The premier platform for esports tournaments, matches, and stats.
    </p>
    <div className="space-x-4">
      <Link to="/login" className="btn btn-primary">
        Sign In
      </Link>
      <Link to="/register" className="btn btn-outline-primary">
        Sign Up
      </Link>
    </div>
  </div>
);

export default HomePage;
