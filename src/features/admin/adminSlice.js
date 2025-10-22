import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchAllUsersPerformance = createAsyncThunk(
  'admin/fetchAllUsersPerformance',
  async (locationId = null, { rejectWithValue }) => {
    try {
      const url = locationId 
        ? `/roleplay/admin-reports/all_users_performance/?location_id=${locationId}`
        : '/roleplay/admin-reports/all_users_performance/';
      
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch all users performance');
    }
  }
);

export const fetchLocationSummary = createAsyncThunk(
  'admin/fetchLocationSummary',
  async (locationId = null, { rejectWithValue }) => {
    try {
      const url = locationId 
        ? `/roleplay/admin-reports/location_summary/?location_id=${locationId}`
        : '/roleplay/admin-reports/location_summary/';
      
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch location summary');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    allUsersPerformance: null,
    locationSummary: null,
    loading: false,
    error: null,
    currentLocationId: null,
  },
  reducers: {
    clearAdminData: (state) => {
      state.allUsersPerformance = null;
      state.locationSummary = null;
      state.error = null;
    },
    setCurrentLocation: (state, action) => {
      state.currentLocationId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsersPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsersPerformance.fulfilled, (state, action) => {
        state.loading = false;
        state.allUsersPerformance = action.payload;
      })
      .addCase(fetchAllUsersPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchLocationSummary.fulfilled, (state, action) => {
        state.locationSummary = action.payload;
      });
  },
});

export const { clearAdminData, setCurrentLocation } = adminSlice.actions;
export default adminSlice.reducer;