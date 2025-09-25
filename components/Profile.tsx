"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  let userName = "";
  if (user?.email === "mickey@mouse.com") {
    userName = "Mickey Mouse !";
  } else if (user?.email === "charlie@brown.com") {
    userName = "Charlie Brown !";
  } else if (user?.email === "pink@panther.com") {
    userName = "Pink Panther !";
  } else if (user?.email === "donald@duck.com") {
    userName = "Donald Duck !";
  }
  return (
    <div>
      <h1 className="text-3xl text-gray-800 text-center mt-5 cursor-default">
        {userName}
      </h1>
    </div>
  );
};

export default Profile;
