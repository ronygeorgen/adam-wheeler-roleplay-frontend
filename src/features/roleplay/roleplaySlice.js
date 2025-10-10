import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchCategories = createAsyncThunk(
  'roleplay/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/roleplay/categories/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch categories');
    }
  }
);

export const fetchModels = createAsyncThunk(
  'roleplay/fetchModels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/roleplay/models/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch models');
    }
  }
);

export const createCategory = createAsyncThunk(
  'roleplay/createCategory',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/roleplay/categories/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'roleplay/updateCategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/roleplay/categories/${id}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update category');
    }
  }
);

export const createModel = createAsyncThunk(
  'roleplay/createModel',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/roleplay/models/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create model');
    }
  }
);

export const updateModel = createAsyncThunk(
  'roleplay/updateModel',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/roleplay/models/${id}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update model');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'roleplay/deleteCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/roleplay/categories/${categoryId}/`);
      return categoryId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete category');
    }
  }
);

export const deleteModel = createAsyncThunk(
  'roleplay/deleteModel',
  async (modelId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/roleplay/models/${modelId}/`);
      return modelId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete model');
    }
  }
);

const roleplaySlice = createSlice({
  name: 'roleplay',
  initialState: {
    categories: [],
    models: [],
    loading: false,
    error: null,
    selectedCategory: null,
    selectedModel: null,
  },
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSelectedModel: (state, action) => {
      state.selectedModel = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure categories is always an array
        state.categories = Array.isArray(action.payload) ? action.payload : action.payload.results || action.payload.data || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.categories = []; // Reset to empty array on error
      })
      .addCase(fetchModels.fulfilled, (state, action) => {
        // Ensure models is always an array
        state.models = Array.isArray(action.payload) ? action.payload : action.payload.results || action.payload.data || [];
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(cat => cat.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(createModel.fulfilled, (state, action) => {
        state.models.push(action.payload);
      })
      .addCase(updateModel.fulfilled, (state, action) => {
        const index = state.models.findIndex(model => model.id === action.payload.id);
        if (index !== -1) {
          state.models[index] = action.payload;
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(cat => cat.id !== action.payload);
        // Also remove models associated with this category
        state.models = state.models.filter(model => model.category !== action.payload);
      })
      .addCase(deleteModel.fulfilled, (state, action) => {
        state.models = state.models.filter(model => model.id !== action.payload);
      });
  },
});

export const { setSelectedCategory, setSelectedModel, clearError } = roleplaySlice.actions;
export default roleplaySlice.reducer;