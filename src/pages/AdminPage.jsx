import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { RefreshCw, Users, Clapperboard } from 'lucide-react';
import UsersList from '../features/users/UsersList';
import EditUserModal from '../features/users/EditUserModal';
import RolePlayList from '../features/roleplay/RolePlayList';
import AddEditCategoryModal from '../features/roleplay/AddEditCategoryModal';
import AddEditModelModal from '../features/roleplay/AddEditModelModal';
import Button from '../components/Button';
import { fetchUsers } from '../features/users/usersSlice';
import { setSelectedCategory, setSelectedModel } from '../features/roleplay/roleplaySlice';

const AdminPage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('users');
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditCategoryMode, setIsEditCategoryMode] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isEditModelMode, setIsEditModelMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchUsers());
    setRefreshing(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users and roleplay content</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'users'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </button>
                <button
                  onClick={() => setActiveTab('roleplay')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'roleplay'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clapperboard className="w-4 h-4" />
                  <span>Role Play</span>
                </button>
              </div>

              {activeTab === 'users' && (
                <Button
                  icon={RefreshCw}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  size="sm"
                  className={refreshing ? 'animate-spin' : ''}
                >
                  Refresh
                </Button>
              )}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <UsersList onEditUser={() => setIsEditUserModalOpen(true)} />
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
