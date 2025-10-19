import React from "react";
import HomeHero from "../components/HomeHero";
import { useState } from 'react';
import '../styles/Home.css';
const Home = () => {
  const [contactClicked, setContactClicked] = useState(false);
  const handleContactClick = () => {
    setContactClicked(!contactClicked);}
  return (
    <>
      <HomeHero /> 
    </>
  );
};
export default Home;