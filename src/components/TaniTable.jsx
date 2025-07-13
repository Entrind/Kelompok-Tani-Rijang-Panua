import React from 'react';

const TaniTable = ({ data }) => {
  return (
    <table className="w-full border text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="border p-2">#</th>
          <th className="border p-2">Nama Kelompok</th>
          <th className="border p-2">Ketua</th>
          <th className="border p-2">Jumlah Anggota</th>
          <th className="border p-2">Luas Garapan</th>
        </tr>
      </thead>
      <tbody>
        {data.map((kelompok, index) => (
          <tr key={kelompok.id}>
            <td className="border p-2 text-center">{index + 1}</td>
            <td className="border p-2">{kelompok.nama}</td>
            <td className="border p-2">{kelompok.ketua}</td>
            <td className="border p-2 text-center">{kelompok.jumlah_anggota}</td>
            <td className="border p-2">{kelompok.luas}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TaniTable;
