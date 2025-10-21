import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Users, Clapperboard, UserCheck, MapPin, ChevronDown, Check } from 'lucide-react';
import UsersList from '../features/users/UsersList';
import EditUserModal from '../features/users/EditUserModal';
import UserReportModal from '../features/users/UserReportModal'; // Add this import
import RolePlayList from '../features/roleplay/RolePlayList';
import AddEditCategoryModal from '../features/roleplay/AddEditCategoryModal';
import AddEditModelModal from '../features/roleplay/AddEditModelModal';
import Button from '../components/Button';
import { fetchUsers, assignCategoriesToAllUsers, fetchLocationsWithUsers } from '../features/users/usersSlice';
import { setSelectedCategory, setSelectedModel } from '../features/roleplay/roleplaySlice';

const AdminPage = () => {
  const dispatch = useDispatch();
  const { users, assigningCategories, locationsWithUsers, locationsLoading } = useSelector((state) => state.users);
  const [activeTab, setActiveTab] = useState('users');
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false); // Add this state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditCategoryMode, setIsEditCategoryMode] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isEditModelMode, setIsEditModelMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationId, setLocationId] = useState(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [hasLocationFromUrl, setHasLocationFromUrl] = useState(false);

  const location = useLocation();
  
  // Step 1: Get locationId from GHL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const locFromQuery = params.get('location');
    if (locFromQuery) {
      setLocationId(locFromQuery);
      setHasLocationFromUrl(true);
      console.log('Location ID from query param:', locFromQuery);
    }
  }, [location.search]);

  // Step 2: Fetch locations if no locationId from URL
  useEffect(() => {
    if (!locationId) {
      dispatch(fetchLocationsWithUsers());
    }
  }, [dispatch, locationId]);

  // Update location name when locations are loaded or locationId changes
  useEffect(() => {
    if (locationId && locationsWithUsers?.length > 0) {
      const locationObj = locationsWithUsers.find(loc => loc.location_id === locationId);
      if (locationObj) {
        setSelectedLocationName(locationObj.location_name);
      } else {
        // If location not found in locationsWithUsers, try to fetch it
        dispatch(fetchLocationsWithUsers());
      }
    }
  }, [locationId, locationsWithUsers, dispatch]);

  // Fetch users when locationId is set (from URL or selection)
  useEffect(() => {
    if (locationId) {
      dispatch(fetchUsers(locationId));
    }
  }, [locationId, dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchUsers(locationId));
    setRefreshing(false);
  };

  const handleAssignCategoriesToAll = async () => {
    if (!locationId) {
      alert('Please select a location first.');
      return;
    }

    if (!window.confirm('Are you sure you want to assign ALL categories to ALL users? This will give every user access to all roleplay content.')) {
      return;
    }

    try {
      const result = await dispatch(assignCategoriesToAllUsers(locationId)).unwrap();
      
      alert(`Successfully assigned categories to all users!\n\nUsers: ${result.users_count}\nCategories: ${result.categories_count}\nAssignments created: ${result.assignments_created}`);
      
      if (locationId) {
        dispatch(fetchUsers(locationId));
      }
      
    } catch (error) {
      console.error('Failed to assign categories:', error);
      alert('Failed to assign categories to all users. Please try again.');
    }
  };

  const handleLocationSelect = (loc) => {
    setLocationId(loc.location_id);
    setSelectedLocationName(loc.location_name);
    setShowLocationDropdown(false);
    // fetchUsers will be triggered by the useEffect above
  };

  const handleAddCategory = () => {
    dispatch(setSelectedCategory(null));
    setIsEditCategoryMode(false);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = () => {
    setIsEditCategoryMode(true);
    setIsCategoryModalOpen(true);
  };

  const handleAddModel = () => {
    dispatch(setSelectedModel(null));
    setIsEditModelMode(false);
    setIsModelModalOpen(true);
  };

  const handleEditModel = () => {
    setIsEditModelMode(true);
    setIsModelModalOpen(true);
  };

  // Add this function to handle viewing reports
  const handleViewReport = () => {
    setIsReportModalOpen(true);
  };

  // Get current location details
  const currentLocation = locationsWithUsers?.find(loc => loc.location_id === locationId);
  
  // Calculate user count - use Redux users array length as it's more reliable
  const userCount = Array.isArray(users) ? users.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#333333] mb-2">Admin Dashboard</h1>
            </div>
            
            {/* Location Selector - Only show if no location in URL */}
            {!hasLocationFromUrl && (
              <div className="relative">
                <div className="flex items-center gap-3">
                  {locationId && (
                    <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{selectedLocationName}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {userCount} users
                      </span>
                    </div>
                  )}
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                      className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-300 hover:border-green-500 transition-colors shadow-sm"
                    >
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">
                        {locationId ? 'Change Location' : 'Select Location'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showLocationDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                        <div className="p-2">
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                            Available Locations
                          </div>
                          {locationsLoading ? (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">
                              Loading locations...
                            </div>
                          ) : locationsWithUsers?.length > 0 ? (
                            locationsWithUsers.map((loc) => (
                              <button
                                key={loc.location_id}
                                onClick={() => handleLocationSelect(loc)}
                                className={`w-full flex items-center justify-between px-3 py-3 text-left rounded-md hover:bg-green-50 transition-colors ${
                                  locationId === loc.location_id ? 'bg-green-50 border border-green-200' : ''
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {loc.location_name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {loc.users.length || 0} users
                                  </div>
                                </div>
                                {locationId === loc.location_id && (
                                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">
                              No locations available
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Show location info only (no dropdown) if location comes from URL */}
            {hasLocationFromUrl && locationId && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                <MapPin className="w-4 h-4 text-green-600" />
                <div>
                  <span className="font-medium">{selectedLocationName}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-500">{userCount} users</span>
                </div>
                <div className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Auto-selected
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'users'
                      ? 'bg-[#DFF0D8] text-[#6EBE3A]'
                      : 'text-[#333333] hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                  {locationId && (
                    <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
                      {userCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('roleplay')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'roleplay'
                      ? 'bg-[#DFF0D8] text-[#6EBE3A]'
                      : 'text-[#333333] hover:bg-gray-50'
                  }`}
                >
                  <Clapperboard className="w-4 h-4" />
                  <span>Role Play</span>
                </button>
              </div>

              {activeTab === 'users' && locationId && (
                <div className="flex space-x-2">
                  <Button
                    variant="success"
                    icon={UserCheck}
                    onClick={handleAssignCategoriesToAll}
                    disabled={assigningCategories}
                    size="sm"
                  >
                    {assigningCategories ? 'Assigning...' : 'Assign Categories to All'}
                  </Button>
                  <Button
                    icon={RefreshCw}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    size="sm"
                    className={refreshing ? 'animate-spin' : ''}
                  >
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'users' && (
              <div className="space-y-4">
                {!locationId ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {hasLocationFromUrl ? 'Loading Location...' : 'Select a Location'}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {hasLocationFromUrl 
                        ? 'Please wait while we load your location data...' 
                        : 'Choose a location from the dropdown above to view and manage users.'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Location Header in Users Tab */}
                    <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-gray-900">{selectedLocationName}</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{userCount}</span> users
                        </div>
                      </div>
                    </div>
                    
                    <UsersList 
                      onEditUser={() => setIsEditUserModalOpen(true)} 
                      onViewReport={handleViewReport} // Add this prop
                      locationId={locationId} 
                    />
                  </>
                )}
              </div>
            )}

            {activeTab === 'roleplay' && (
              <RolePlayList
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onAddModel={handleAddModel}
                onEditModel={handleEditModel}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
      />

      {/* Add the UserReportModal */}
      <UserReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        user={useSelector((state) => state.users.selectedUser)} // Get selected user from Redux
      />

      <AddEditCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        isEdit={isEditCategoryMode}
      />

      <AddEditModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        isEdit={isEditModelMode}
      />
    </div>
  );
};

export default AdminPage;