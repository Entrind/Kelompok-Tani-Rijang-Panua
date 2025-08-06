import React from "react";

export default function SearchBar({ value, onChange, placeholder = "Cari..." }) {
  return (
    <div className="w-full max-w-2xl">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 border border-green-700 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800 placeholder-gray-400 bg-white"
      />
    </div>
  );
}
