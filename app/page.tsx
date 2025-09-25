"use client";

import { useAuth } from "@/context/AuthContext";

const Homepage = () => {
  const { user } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] w-[100%]">
      <h1 className="text-5xl font-semibold text-gray-700 text-center mr-30">
        Homepage
      </h1>
      {user && (
        <h1 className="text-3xl font-semibold text-gray-500 text-center mr-30 mt-10">
          Velcome {user?.name} !
        </h1>
      )}
    </div>
  );
};

export default Homepage;
