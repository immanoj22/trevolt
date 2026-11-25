import { createSlice } from "@reduxjs/toolkit";

export const feeSettingSlice = createSlice({

    name: 'future',

    initialState: {
        feeSettingsList: [],
    },

    reducers: {
        FeeSettingsList: (state, action) => {
            state.feeSettingsList = action.payload.feeSettingsList
        },
    }
});


export const { FeeSettingsList } = feeSettingSlice.actions;

export default feeSettingSlice.reducer;