import React, { useEffect, useCallback, useState } from "react";
import { ActivityIndicator, View, FlatList, Pressable, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Text from "../../Components/text";
import Card from "../../Components/Card";
import NoData from "../../Components/Nodata";
import { Switch } from "../../Components/Field";
import { Colors } from "../../Utilities/uiasset";
import Mainview from "../../Components/mainview";
import { setUnreadCount } from "../../Slices/helper";
import VectorIcons from "../../Utilities/vectoricons";
import useApiError from "../../Actions/Hooks/errorhook";
import { dateTimeFormat } from "../../Utilities/dateTime";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { windowheight, windowwidth } from "../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import { useLazyNotificationQuery, useUpdateNotificationMutation } from "../../Slices/auth";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Notification'>;

const Notification: React.FC<Props> = ({ route }) => {
    const { theme, navigation, dispatch } = useCustomHooks();
    const { accountId } = useSelector((state: any) => state.auth.userData);

    // Set when this screen is opened by tapping a push notification (App.tsx).
    const openedNotificationId = route?.params?.notificationId;

    const [notifications, setNotifications] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showReads, setShowRead] = useState(false);
    const [notification] = useLazyNotificationQuery();
    const [updateNotification, { error, isLoading }] = useUpdateNotificationMutation();

    useApiError(error)

    const handleShowRead = async (value: any) => {
        setShowRead(value);
        setPagination({ page: 1, limit: 10 });
    }

    const fetchData = async (page = 1, showRead = showReads) => {
        setLoading(true)
        try {
            const payload = {
                page,
                limit: pagination.limit,
                showRead: showRead,
            };
            const response = await notification(payload);
            if (response?.data?.success) {
                const newData = response.data?.result?.data || [];
                const totalCount = response.data?.result?.count || 0;
                setNotifications((prev) => (page === 1 ? newData : [...prev, ...newData]));
                const totalFetched = (page - 1) * pagination.limit + newData.length;
                setHasMore(totalFetched < totalCount);
                setPagination((prev) => ({ ...prev, page }));
            } else {
                setNotifications([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const unreadCount = notifications?.filter((item: any) => !item.isRead).length;

    useEffect(() => {
        dispatch(setUnreadCount(unreadCount));
    }, [unreadCount, dispatch]);

    useFocusEffect(
        useCallback(() => {
            fetchData(1);
        }, [showReads])
    );

    const loadMore = () => {
        if (!hasMore || loading) return;
        fetchData(pagination.page + 1);
    };

    const renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={{ paddingTop: 10, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="small" color={theme.darktext} style={{ marginBottom: "1%" }} />
            </View>
        );
    };

    const handleMarkAllRead = async (currentId: any) => {
        const payload = {
            id: currentId,
            accountId: accountId
        }
        const response = await updateNotification(payload);
        if (response.data?.success) {
            fetchData(1, showReads)
            dispatch(setUnreadCount(unreadCount))
        } else {
            console.log("Error")
        }
    }

    // Opened from a push notification tap — mark that one read so the list and the
    // unread badge reflect that the user has seen it.
    useEffect(() => {
        if (!openedNotificationId || openedNotificationId === "undefined") return;
        handleMarkAllRead(openedNotificationId);
    }, [openedNotificationId]);

    return (
        <Mainview
            onleftfn={() => navigation.goBack()}
            headertitle="Notification"
            isscollable={false}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
            >
            <View style={{ height: windowheight * 0.9, justifyContent: "flex-start", marginBottom: 20 }}>
                <View style={{ paddingVertical: 10, justifyContent: "space-between", flexDirection: 'row', paddingBottom: 15 }}>
                    <Switch
                        label="Show Unread"
                        value={showReads}
                        onChange={(e) => handleShowRead(e)}
                        labelStyle={{ color: unreadCount > 0 ? theme.darktext : theme.secondarytext }}
                    />
                    <TouchableOpacity style={{ flexDirection: "row" }} disabled={isLoading} onPress={() => handleMarkAllRead("all")}>
                        <VectorIcons
                            family="Ionicons"
                            name={"checkmark-done-outline"}
                            size={18}
                            iconcolor={unreadCount > 0 ? theme.darktext : theme.secondarytext}
                        />
                        <Text color={unreadCount > 0 ? theme.darktext : theme.secondarytext}> Mark all as read</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={notifications}
                    keyExtractor={(item, index) => item?._id?.toString() ?? index.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    onEndReachedThreshold={0.2}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", justifyContent: "center", height: windowwidth }}>
                            <NoData title="Notification Empty" />
                        </View>}
                    onEndReached={loadMore}
                    renderItem={({ item }) => (
                        <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} key={item._id} containerStyle={{ height: "auto", justifyContent: "center", alignItems: "center", marginVertical: 6, padding: 10, width: "100%" }}>
                            <Pressable disabled={item.isRead || isLoading} style={{ width: "100%" }} onPress={() => handleMarkAllRead(item._id)}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                    <Text family="semiBold" size="semimedium" style={{ color: theme.primarytext }}>{item.title}</Text>
                                    {
                                        item.isRead === false && (
                                            <VectorIcons
                                                family="Octicons"
                                                name="dot-fill"
                                                iconcolor={Colors.brand}
                                                size={18}
                                            />
                                        )
                                    }
                                </View>
                                <Text family="regular" size="semismall" style={{ marginTop: 8, lineHeight: 18, color: theme.graytext }}>{item.description}</Text>
                                <Text family="regular" size="semismall" style={{ color: Colors.brand, marginTop: 8 }}>{dateTimeFormat(item.createdAt)}</Text>
                            </Pressable>
                        </Card>
                    )}
                />
            </View>
        </Mainview>
    )
}

export default Notification;