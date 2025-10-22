import { configureStore } from '@reduxjs/toolkit';
import usersReducer from '../features/users/usersSlice';
import roleplayReducer from '../features/roleplay/roleplaySlice';
import adminReducer from '../features/admin/adminSlice';

export const store = configureStore({
  reducer: {
    users: usersReducer,
    roleplay: roleplayReducer,
    admin: adminReducer,
  },
});
