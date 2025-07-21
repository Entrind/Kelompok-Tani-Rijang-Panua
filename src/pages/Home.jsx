import React from 'react';
import { kelompokTani } from '../data/kelompok';
import TaniCard from '../components/cards/TaniCard';

const Home = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Daftar Kelompok Tani</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {kelompokTani.map((kelompok) => (
          <TaniCard key={kelompok.id} kelompok={kelompok} />
        ))}
      </div>
    </div>
  );
};

export default Home;
