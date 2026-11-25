import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

interface PaginationState {
    page: number;
    limit: number;
}

interface UsePaginatedFetchProps {
    apiFunc: any;
    futureId: any;
    tradeMode: any;
    dependencies?: any[];
}

export default function usePaginatedFetch({
    apiFunc,
    futureId,
    tradeMode,
    dependencies = [],
}: UsePaginatedFetchProps) {
    const [data, setData] = useState<any[]>([]);
    const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 10 });
    const [count, setCount] = useState(0);
    const [nextPage, setNextPage] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetchData = async (reqData: any, isLoadMore = false) => {
        try {
            if (futureId.current && futureId.current !== "") {
                const params = {
                    pairId: futureId.current,
                    tradeMode,
                    page: reqData.page,
                    limit: reqData.limit,
                };
                const res = await apiFunc(params);
                if (res?.data?.success) {
                    const newData = res.data?.result?.data || [];
                    setData((prev) => (isLoadMore ? [...prev, ...newData] : newData));
                    setCount(res.data?.result?.count);
                    setNextPage(res.data?.result?.nextPage);
                } else if (!isLoadMore) {
                    setData([]);
                }
            }
        } catch (err) {
            console.log("Pagination fetch error:", err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const loadMore = async () => {
        if (isLoadingMore || !nextPage) return;
        try {
            setIsLoadingMore(true);
            const nextPageNum = pagination.page + 1;
            setPagination((prev) => ({ ...prev, page: nextPageNum }));
            await fetchData({ page: nextPageNum, limit: pagination.limit }, true);
        } catch (err) {
            console.log("Load more error:", err);
            setIsLoadingMore(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setPagination({ page: 1, limit: 10 });
            fetchData({ page: 1, limit: 10 });
        }, [futureId.current, tradeMode, ...dependencies])
    );

    return {
        data,
        pagination,
        count,
        nextPage,
        isLoadingMore,
        loadMore,
        setCount,
        setNextPage,
        refetch: () => fetchData({ page: 1, limit: 10 }),
    };
}

export const groupOptionsByStrike = (pairlist: any[]) => {
    const map: Record<number, any> = {};

    pairlist?.forEach((item) => {
        const strike = item.strikePrice;

        if (!map[strike]) {
            map[strike] = {
                type: "group",
                strikePrice: strike,
                call: null,
                put: null,
            };
        }

        if (item.optionType === "CALL") {
            map[strike].call = item;
        } else if (item.optionType === "PUT") {
            map[strike].put = item;
        }
    });

    return Object.values(map);
};