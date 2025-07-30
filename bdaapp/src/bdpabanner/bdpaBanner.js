import React from 'react';
import myImage from '../bdpabanner/bdpaLogo.png'; // Make sure the path is correct

const TopRightImage = () => {
  const imageStyle = {
    position: 'fixed',
    top: '10px',
    right: '10px',
    width: '50px',
    height: '50px',
    zIndex: 9999,
  };

  return (
    <img src={myImage} alt="Top Right Icon" style={imageStyle} />
  );
};

export default TopRightImage;
