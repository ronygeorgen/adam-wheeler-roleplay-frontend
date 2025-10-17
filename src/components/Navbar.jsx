import { Link, useLocation } from 'react-router-dom';
import { Users, Clapperboard } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  
  // Extract email from current URL if present
  const searchParams = new URLSearchParams(location.search);
  const userEmail = searchParams.get('email');

  const isActive = (path) => location.pathname === path;

  // Helper function to build URL with email parameter
  const buildUrl = (path) => {
    return userEmail ? `${path}?email=${encodeURIComponent(userEmail)}` : path;
  };

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
          
          {/* Add user email display on the right side */}
          <div className="flex items-center">
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