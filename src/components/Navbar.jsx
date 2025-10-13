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
            <Link to={buildUrl("/")} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#6EBE3A] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold text-[#333333]">GHL Admin</span>
            </Link>

            <div className="flex space-x-4">
              {/* <Link
                to="/admin"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  isActive('/admin')
                    ? 'bg-[#DFF0D8] text-[#6EBE3A]'
                    : 'text-[#333333] hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">Admin Panel</span>
              </Link> */}

              {/* <Link
                to={buildUrl("/user")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  isActive('/user')
                    ? 'bg-[#DFF0D8] text-[#6EBE3A]'
                    : 'text-[#333333] hover:bg-gray-50'
                }`}
              >
                <Clapperboard className="w-4 h-4" />
                <span className="font-medium">User Side</span>
              </Link> */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;