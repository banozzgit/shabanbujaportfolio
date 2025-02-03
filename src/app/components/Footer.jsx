"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

const Footer = () => {
  const [visitors, setVisitors] = useState(0);


  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const response = await axios.get("https://shabanbujaportfolio.onrender.com/visitors");
        setVisitors(response.data.visitors);
      } catch (err) {
        console.error("Failed to fetch visitors:", err);
      }
    };

    fetchVisitors();
  }, []);

  return (
    <footer className="footer border z-10 border-t-[#33353F] border-l-transparent border-r-transparent text-white">
      <div className="container p-12 flex justify-between">
      {/* <img 
            src="images/logo-removebg-preview.png" 
            alt="CV" 
            className="w-8 h-8 md:w-16 md:h-16" 
            width={64} 
            height={64} 
          />      */}

<div className="text-white bg-gray-800 px-4 py-2 rounded-lg shadow-md border border-gray-600">
          📊 Visitors Today: <span className="font-bold text-green-400">{visitors}</span>
        </div>
          
             <p className="text-slate-600">All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
