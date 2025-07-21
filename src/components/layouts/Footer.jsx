import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-lime-800 text-sm text-white py-4 mt-8 border-t">
      <div className="max-w-7xl mx-auto text-center">
        &copy; {new Date().getFullYear()} Desa Rijang Panua. Dibuat untuk KKN Tematik UNHAS.
      </div>
    </footer>
  );
};

export default Footer;
