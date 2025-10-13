import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Users, Clapperboard, UserCheck } from 'lucide-react';
import UsersList from '../features/users/UsersList';
import EditUserModal from '../features/users/EditUserModal';
import RolePlayList from '../features/roleplay/RolePlayList';
import AddEditCategoryModal from '../features/roleplay/AddEditCategoryModal';
import AddEditModelModal from '../features/roleplay/AddEditModelModal';
import Button from '../components/Button';
import { fetchUsers, assignCategoriesToAllUsers } from '../features/users/usersSlice';
import { setSelectedCategory, setSelectedModel } from '../features/roleplay/roleplaySlice';

const AdminPage = () => {
  const dispatch = useDispatch();
  const { users, assigningCategories } = useSelector((state) => state.users);
  const [activeTab, setActiveTab] = useState('users');
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditCategoryMode, setIsEditCategoryMode] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isEditModelMode, setIsEditModelMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationId, setLocationId] = useState(null);

  const location = useLocation();
  // Step 1: Get locationId from GHL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const locFromQuery = params.get('location'); // matches ?location=XYZ
    if (locFromQuery) {
      setLocationId(locFromQuery);
      console.log('Location ID from query param:', locFromQuery);
    }
  }, [location.search]);

  // Step 2: Fallback to users if query param missing
  useEffect(() => {
    if (!locationId && users.length > 0) {
      const firstUser = users[0];
      const extractedLocationId = firstUser.location_id || firstUser.location?.location_id;
      if (extractedLocationId) {
        setLocationId(extractedLocationId);
        console.log('Location ID from first user:', extractedLocationId);
      }
    }
  }, [users, locationId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchUsers());
    setRefreshing(false);
  };

  const handleAssignCategoriesToAll = async () => {
    if (!locationId) {
      alert('No location found. Please refresh users first.');
      return;
    }

    if (!window.confirm('Are you sure you want to assign ALL categories to ALL users? This will give every user access to all roleplay content.')) {
      return;
    }

    try {
      const result = await dispatch(assignCategoriesToAllUsers(locationId)).unwrap();
      
      // Show success message with details
      alert(`Successfully assigned categories to all users!\n\nUsers: ${result.users_count}\nCategories: ${result.categories_count}\nAssignments created: ${result.assignments_created}`);
      
      // Refresh users to get updated category assignments
      dispatch(fetchUsers());
      
    } catch (error) {
      console.error('Failed to assign categories:', error);
      alert('Failed to assign categories to all users. Please try again.');
    }
  };

  // ... rest of your AdminPage code remains the same
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#333333] mb-2">Admin Dashboard</h1>
          {/* <p className="text-gray-600">Manage users and roleplay content</p> */}
          {/* {locationId && (
            <p className="text-sm text-gray-500 mt-1">
              Location ID: {locationId}
            </p>
          )} */}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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

              {activeTab === 'users' && (
                <div className="flex space-x-2">
                  <Button
                    variant="success"
                    icon={UserCheck}
                    onClick={handleAssignCategoriesToAll}
                    disabled={assigningCategories || !locationId}
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

          <div className="p-6">
            {activeTab === 'users' && (
              <div className="space-y-4">
                {!locationId && users.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      Unable to detect location ID. The "Assign Categories to All" feature may not work properly.
                      Please check the console for debugging information.
                    </p>
                  </div>
                )}
                <UsersList onEditUser={() => setIsEditUserModalOpen(true)} />
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

      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
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