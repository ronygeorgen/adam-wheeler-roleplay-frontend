import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/ghl/get-users/');
      console.log('Fetched users data:', response.data); // ADD DEBUG LOG
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch users');
    }
  }
);

// ... rest of your usersSlice remains the same
export const updateUserStatus = createAsyncThunk(
  'users/updateUserStatus',
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/roleplay/users/${userId}/`, {
        status,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update user status');
    }
  }
);

export const assignCategoriesToUser = createAsyncThunk(
  'users/assignCategories',
  async ({ userId, categoryIds }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/roleplay/users/${userId}/assign_categories/`, {
        category_ids: categoryIds,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to assign categories');
    }
  }
);

export const assignCategoriesToAllUsers = createAsyncThunk(
  'users/assignCategoriesToAll',
  async (locationId, { rejectWithValue }) => {
    try {
      console.log('Sending location ID to backend:', locationId); // ADD DEBUG LOG
      const response = await axiosInstance.post('/ghl/assign-categories-to-all/', {
        location_id: locationId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to assign categories to all users');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/roleplay/users/${userId}/`);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete user');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null,
    selectedUser: null,
    assigningCategories: false,
  },
  reducers: {
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        console.log('Users stored in Redux:', action.payload); // ADD DEBUG LOG
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.user_id === action.payload.user_id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(assignCategoriesToUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.user_id === action.payload.user_id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(assignCategoriesToAllUsers.pending, (state) => {
        state.assigningCategories = true;
        state.error = null;
      })
      .addCase(assignCategoriesToAllUsers.fulfilled, (state, action) => {
        state.assigningCategories = false;
      })
      .addCase(assignCategoriesToAllUsers.rejected, (state, action) => {
        state.assigningCategories = false;
        state.error = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.user_id !== action.payload);
      });
  },
});

export const { setSelectedUser, clearError } = usersSlice.actions;
export default usersSlice.reducer;