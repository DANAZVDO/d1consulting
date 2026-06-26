import React from 'react';

export const PlaceholderPage = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-500 mt-2 max-w-md">
        This page is currently under development. Stay tuned for updates!
      </p>
    </div>
  );
};
