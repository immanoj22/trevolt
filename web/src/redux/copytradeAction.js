import { createSlice } from "@reduxjs/toolkit";

export const copyTradeSlice = createSlice({

    name: 'copytrade',

    initialState: {
        allStrategy: [],
        myStrategy: {}
    },
    
    reducers: {
        allStrategies: (state, action) => {
            state.allStrategy = action.payload.allStrategies
        },

        myStrategies: (state, action) => {
            state.myStrategy = action.payload.myStrategies
        },
    }
});


export const { allStrategies, myStrategies } = copyTradeSlice.actions;

export default copyTradeSlice.reducer;