import React from 'react';
import { kelompokTani } from '../data/kelompok';
import TaniTable from '../components/TaniTable';

const Home = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Daftar Kelompok Tani</h1>
      <TaniTable data={kelompokTani} />
    </div>
  );
};

export default Home;
