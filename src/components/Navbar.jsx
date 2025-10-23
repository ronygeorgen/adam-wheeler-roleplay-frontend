import { Link, useLocation } from 'react-router-dom';
import { Users, Clapperboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance'; // adjust path as needed

const Navbar = () => {
  const location = useLocation();
  const [userData, setUserData] = useState(null);
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
      const response = await axiosInstance.get('/accounts/auth/connect/');
      // Handle the response as needed
      console.log('Onboard response:', response.data);
      
      // If you need to redirect or do something with the response
      // For example, if it returns a URL to redirect to:
      if (response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      }
    } catch (error) {
      console.error('Onboard failed:', error);
      // Handle error (show toast, message, etc.)
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data to check role
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userEmail) return;
      
      try {
        // You might need to adjust this endpoint based on your API
        const response = await axiosInstance.get(`/users/?email=${userEmail}`);
        if (response.data && response.data.length > 0) {
          setUserData(response.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, [userEmail]);

  // Check if user is admin
  const isAdmin = userData?.role === 'admin';

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
            {/* Onboard Button - Only show for admin */}
           
              <button
                onClick={handleOnboard}
                disabled={loading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : 'Onboard'}
              </button>
           
            
            {/* User email display */}
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {userEmail ? userEmail : 'Admin'}
              {userData && (
                <span className="ml-2 text-xs text-gray-500">
                  ({userData.role})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;