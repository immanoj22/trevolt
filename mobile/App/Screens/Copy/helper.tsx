import { useCallback, useState } from "react";

import { useDispatch } from "react-redux";

import { store } from "../../Slices";
import { setFavStrategies } from "../../Slices/auth";

import { useAddFavMutation } from "../../Slices/copy";
import useApiError from "../../Actions/Hooks/errorhook";
import useCustomHooks from "../../Actions/Hooks/customhook";

export default function useFavorite() {
    const { successtoast } = useCustomHooks();

    const dispatch = useDispatch();
    const [addFav, { error, isLoading }] = useAddFavMutation();
    useApiError(error);

    const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);

    const toggleFavorite = useCallback(async (copyId: any) => {
        const { favStradegies, accountId } = store.getState().auth.userData;

        const isCurrentlyFav = (favStradegies ?? []).some(
            (fav: any) => fav.strategyId === copyId && fav.accountId === accountId
        );

        const updatedFavs = isCurrentlyFav
            ? (favStradegies ?? []).filter(
                (fav: any) => !(fav.strategyId === copyId && fav.accountId === accountId)
            )
            : [...(favStradegies ?? []), { strategyId: copyId, accountId }];

        // optimistic update so the heart icon flips instantly, before the API responds
        dispatch(setFavStrategies(updatedFavs));

        setFavoriteLoadingId(copyId);
        try {
            const payload = {
                strategyId: copyId
            }
            const response = await addFav(payload).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
            } else {
                dispatch(setFavStrategies(favStradegies ?? []));
                console.log("error", "fav")
            }
        } catch (err) {
            dispatch(setFavStrategies(favStradegies ?? []));
            console.log("Fav API Error", err);
        } finally {
            setFavoriteLoadingId(null);
        }
    }, []);

    return { toggleFavorite, isFavoriteLoading: isLoading, isFavoriteLoadingId: favoriteLoadingId };
}


export const source = [
    { label: "Last 7D", value: "7d" },
    { label: "Last 10D", value: "10d" },
    { label: "Last 1M", value: "1m" },
    { label: "Last 1Y", value: "1y" },
];

export const source2 = [
    { label: "Last 7D", value: "7d" },
    { label: "Last 10D", value: "10d" },
    { label: "Last 1M", value: "1m" },
    { label: "Last 1Y", value: "1y" },
];


// const niceNum = (range: number, round: boolean) => {
//     const exponent = Math.floor(Math.log10(range));
//     const fraction = range / Math.pow(10, exponent);
//     let niceFraction;
//     if (round) {
//         if (fraction < 1.5) niceFraction = 1;
//         else if (fraction < 3) niceFraction = 2;
//         else if (fraction < 7) niceFraction = 5;
//         else niceFraction = 10;
//     } else {
//         if (fraction <= 1) niceFraction = 1;
//         else if (fraction <= 2) niceFraction = 2;
//         else if (fraction <= 5) niceFraction = 5;
//         else niceFraction = 10;
//     }
//     return niceFraction * Math.pow(10, exponent);
// };

// export const getYAxisConfig = (data: any[], maxTicks = 4, addHeadroom = false) => {
//     const values = data.map((d) => d.value);
//     const maxVal = Math.max(...values, 0);
//     const minVal = Math.min(...values, 0);
//     const range = maxVal - minVal;

//     if (!isFinite(range) || range === 0) {
//         return { stepValue: 1, noOfSections: 1, noOfSectionsBelowXAxis: 0, maxValue: 1, mostNegativeValue: 0 };
//     }

//     const stepValue = niceNum(range / maxTicks, true);

//     let sectionsAbove = Math.max(Math.round(Math.ceil(maxVal / stepValue)), maxVal > 0 ? 1 : 0);
//     let sectionsBelow = Math.max(Math.round(Math.ceil(Math.abs(minVal) / stepValue)), minVal < 0 ? 1 : 0);

//     if (sectionsAbove === 0 && sectionsBelow === 0) sectionsAbove = 1;

//     if (addHeadroom) sectionsAbove += 1;

//     const MAX_TOTAL_SECTIONS = 6;
//     if (sectionsAbove + sectionsBelow > MAX_TOTAL_SECTIONS) {
//         const scale = MAX_TOTAL_SECTIONS / (sectionsAbove + sectionsBelow);
//         sectionsAbove = Math.max(sectionsAbove > 0 ? 1 : 0, Math.round(sectionsAbove * scale));
//         sectionsBelow = Math.max(sectionsBelow > 0 ? 1 : 0, Math.round(sectionsBelow * scale));
//     }

//     console.log("sectionsAbove____", {
//         stepValue,
//         noOfSections: sectionsAbove,
//         noOfSectionsBelowXAxis: sectionsBelow,
//         maxValue: sectionsAbove * stepValue,
//         mostNegativeValue: -(sectionsBelow * stepValue),
//     });

//     return {
//         stepValue,
//         noOfSections: sectionsAbove,
//         noOfSectionsBelowXAxis: sectionsBelow,
//         maxValue: sectionsAbove * stepValue,
//         mostNegativeValue: -(sectionsBelow * stepValue),
//     };
// };

const niceNum = (range: number, round: boolean) => {
    if (range <= 0 || !isFinite(range)) return 1;

    const exponent = Math.floor(Math.log10(range));
    const fraction = range / Math.pow(10, exponent);

    let niceFraction;

    if (round) {
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
    } else {
        if (fraction <= 1) niceFraction = 1;
        else if (fraction <= 2) niceFraction = 2;
        else if (fraction <= 5) niceFraction = 5;
        else niceFraction = 10;
    }

    return niceFraction * Math.pow(10, exponent);
};

export const getYAxisConfig = (
    data: any[],
    maxTicks = 4,
    addHeadroom = true
) => {

    const values = data.map(d => d.value);

    const maxVal = Math.max(...values, 0);
    const minVal = Math.min(...values, 0);

    const range = maxVal - minVal;

    if (range === 0) {
        return {
            stepValue: 1,
            noOfSections: 2,
            noOfSectionsBelowXAxis: 0,
            maxValue: 2,
            mostNegativeValue: 0,
        };
    }

    const stepValue = niceNum(range / maxTicks, true);

    let sectionsAbove = Math.max(
        Math.ceil(maxVal / stepValue),
        1
    );

    let sectionsBelow = Math.max(
        Math.ceil(Math.abs(minVal) / stepValue),
        1
    );

    if (addHeadroom && maxVal > 0) {
        sectionsAbove++;
    }

    if (addHeadroom && minVal < 0) {
        sectionsBelow++;
    }

    return {
        stepValue,
        noOfSections: sectionsAbove,
        noOfSectionsBelowXAxis: sectionsBelow,
        maxValue: sectionsAbove * stepValue,
        mostNegativeValue: -(sectionsBelow * stepValue),
    };
};

export const prepareChartData = (
    labels: string[],
    values: number[],
    type: "roi" | "pnl"
) => {
    labels = labels ?? [];
    values = values ?? [];
    const numericValues = values.map(v => Number(v) || 0);

    const max = Math.max(...numericValues);
    const min = Math.min(...numericValues);

    const range = Math.max(Math.abs(max), Math.abs(min));

    const offset = Math.max(range * 0.05, 0.1);

    return labels.map((label, index) => {
        let value = numericValues[index];

        if (
            value === 0 &&
            max > 0 &&
            min < 0
        ) {
            value = -offset;
        }

        return {
            label,
            value,
            actualValue: numericValues[index],
        };
    });
};
