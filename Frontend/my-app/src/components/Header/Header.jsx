import React from 'react';
import GuestHeader from './GuestHeader';
import BuyerHeader from './BuyerHeader';
import SellerHeader from './SellerHeader';

const Header = ({ userType }) => {
  switch (userType) {
    case 'buyer':
      return <BuyerHeader />;
    case 'seller':
      return <SellerHeader />;
    default:
      return <GuestHeader />;
  }
};

export default Header;