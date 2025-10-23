import { Link, useLocation } from 'react-router-dom';
import { Users, Clapperboard } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance'; // adjust path as needed
import Button from './Button';

const Navbar = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  // Extract email from current URL if present
  const searchParams = new URLSearchParams(location.search);
  const userEmail = searchParams.get('email');

  const isActive = (path) => location.pathname === path;

  // Helper function to build URL with email parameter
  const buildUrl = (path) => {
    return userEmail ? `${path}?email=${encodeURIComponent(userEmail)}` : path;
  };

  // Function to handle onboard process
  const handleOnboard = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Open OAuth in new window
      window.open(
        '/accounts/auth/connect/',
        'ghl-auth',
        'width=600,height=700,scrollbars=yes'
      );
      setLoading(false);
    } catch (error) {
      console.error('Onboard failed:', error);
      setLoading(false);
    }
  };

  const showOnboardButton = location.pathname.includes('/admin');

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            {/* Logo without navigation */}
            <div className="flex items-center space-x-2 cursor-default">
              <img 
                src="/Perform-Group-Logo.png" 
                alt="Perform Group Logo" 
                className="h-14 w-auto"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
          {showOnboardButton && (
              <button
                onClick={handleOnboard}
                disabled={loading}
                className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#6EBE3A] hover:bg-[#4C9441] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6EBE3A] transition-all duration-200 shadow-sm ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Onboard'}
              </button>
            )}
           
            
            {/* User email display */}
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {userEmail ? userEmail : 'Admin'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;