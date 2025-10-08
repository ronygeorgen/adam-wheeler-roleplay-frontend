import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Edit, Power, PowerOff, Mail, Phone, MapPin } from 'lucide-react';
import { fetchUsers, updateUserStatus, setSelectedUser } from './usersSlice';
import Button from '../../components/Button';

const UsersList = ({ onEditUser }) => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    await dispatch(updateUserStatus({ userId: user.user_id, status: newStatus }));
  };

  const handleEditUser = (user) => {
    dispatch(setSelectedUser(user));
    onEditUser();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {typeof error === 'string' ? error : 'An error occurred'}
      </div>
    );
  }

  // Fix: Check if users is an array before mapping
  if (!Array.isArray(users)) {
    return (
      <div className="text-center py-12 text-gray-500">
        No users data available
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {users.map((user) => (
        <div
          key={user.user_id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {user.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.location_name && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location_name}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Role:</span> {user.role}
                </div>
                {user.assigned_categories && user.assigned_categories.length > 0 && (
                  <div>
                    <span className="font-medium">Assigned Categories:</span>{' '}
                    {user.assigned_categories.map(cat => cat.name).join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon={Edit}
                onClick={() => handleEditUser(user)}
              >
                Edit
              </Button>
              <Button
                variant={user.status === 'active' ? 'danger' : 'success'}
                size="sm"
                icon={user.status === 'active' ? PowerOff : Power}
                onClick={() => handleToggleStatus(user)}
              >
                {user.status === 'active' ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>
        </div>
      ))}

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No users found
        </div>
      )}
    </div>
  );
};

export default UsersList;