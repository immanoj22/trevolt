import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Chart from "./chart";
import FullViewChart from "../Chart/chart";
import Text from "../../Components/text";
import Mainview from "../../Components/mainview";
import Positions from "../Portfolio/Sections/Positions";
import Flexcomponent from "../../Components/flexcomponent";
import useCustomHooks from "../../Actions/Hooks/customhook";
import VectorIcons from "../../Utilities/vectoricons";
import Currencyselect from "../../Components/currencyselect";
import { getTokenImage, isEmpty } from "../../Utilities/helerfunction";
import { Colors, Fontfamily } from "../../Utilities/uiasset";
import { BottomTabParamList } from "../../Navigations/navigationtypes";
import { borderradius, RFvalue, windowheight, windowwidth } from "../../Utilities/dimensions";
import { MakerFee, TakerFee } from "../../Slices/future";
import { formatDisplayPair } from "../../Utilities/formatPair";

import { style } from "./style";

// Price text colour by tick direction: 'up' -> green, 'down' -> red, else neutral.
const dirColor = (dir: any, neutral: any) =>
    dir === "up" ? Colors.green : dir === "down" ? Colors.red : neutral;
import BuysellNew from "../Buysell/buysellNew";
import LinearGradient from "../../Components/lineargradient";
import Images from "../../Utilities/images";
import RecentTrades from "./recenttrades";
import OrderBookStacked from "./orderbookstacked";

interface FutureProps {
  onBack?: () => void;
  // Distinguishes "the pair name was tapped from inside the full-screen Chart
  // view" from a plain onBack, so the caller (Market) can remember to reopen
  // Chart (not just Future) if the user backs out without picking a new pair.
  // Falls back to onBack when not supplied.
  onSelectPairFromChart?: () => void;
  // Set by Market when it's re-mounting this screen because the user backed out
  // of the Chart view without picking a pair - reopens Chart immediately instead
  // of landing on the plain Future screen underneath it.
  autoOpenChart?: boolean;
}

const Future: React.FC<FutureProps> = ({ onBack, onSelectPairFromChart, autoOpenChart }) => {
  const { theme, dispatch, navigation } = useCustomHooks();
  const styles = style(theme);
  const insets = useSafeAreaInsets();
  // The screen's actual visible viewport - windowheight is the full device height,
  // which also includes the status bar (insets.top) and the bottom tab bar (rendered
  // by the outer Tab.Navigator, sized as insets.bottom + windowheight*0.08 there -
  // see bottomtab.tsx). Using raw windowheight as a minHeight below overshot the real
  // scrollable area by that whole chrome amount, which is exactly the dead black gap
  // that showed up between the Buy button and the bottom tab bar.
  const visibleViewportHeight = windowheight - insets.top - insets.bottom - (windowheight * 0.08);
  const futureTicker = useSelector((state: any) => state.future.futureTicker);
  const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
  const feeSettingsList = useSelector((state: any) => state.fee.feeSettingsList);
  const [activeTab, setActiveTab] = useState("Position");

  // Fees for this pair only get resolved here - buysellNew.tsx reads state.future.takerFee
  // directly but never triggers this lookup itself, so it previously relied entirely on
  // Market/market.tsx's identical effect having already run for the current pair. Any
  // entry point that swaps this screen in without going through Market first (e.g. the
  // Home "Chart" shortcut) left takerFee unset, so Fees always showed 0.00. Matches the
  // same fix already applied to Option/index.tsx for tradeMode 'option'.
  useEffect(() => {
    if (!futureTradePair || !feeSettingsList) return;
    let makerFee = feeSettingsList.find((val: any) => (
      val.pairName == futureTradePair?.tikerRoot && val.tradeMode == 'future' && val.status == 'active' && val.feeType == 'maker'
    ));
    let takerFee = feeSettingsList.find((val: any) => (
      val.pairName == futureTradePair?.tikerRoot && val.tradeMode == 'future' && val.status == 'active' && val.feeType == 'taker'
    ));
    if (isEmpty(makerFee)) {
      makerFee = feeSettingsList.find((val: any) => (
        val.pairName == 'all' && val.tradeMode == 'future' && val.status == 'active' && val.feeType == 'maker'
      ));
    }
    if (isEmpty(takerFee)) {
      takerFee = feeSettingsList.find((val: any) => (
        val.pairName == 'all' && val.tradeMode == 'future' && val.status == 'active' && val.feeType == 'taker'
      ));
    }
    dispatch(MakerFee({ makerFee: makerFee?.feePercentage }));
    dispatch(TakerFee({ takerFee: takerFee?.feePercentage }));
  }, [futureTradePair, feeSettingsList]);

  const [showChart, setShowChart] = useState(true);
  // Embedded Positions tab shows every open position, unfiltered by pair - matches
  // web's TradeTabs.jsx Position tab, which isn't scoped to the currently-viewed pair.
  const embeddedFutureId = useRef("all");
  const scrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<string, number>>({});

  const tabs = ["Position", "Recent Trades"];

  const [showFullChart, setShowFullChart] = useState(!!autoOpenChart);

  // Native timeframe selector for the embedded chart.
  const chartIntervals = ["5s", "1m", "5m", "15m", "1h", "4h"];
  const [chartInterval, setChartInterval] = useState("1h");

  // Measured height of the BuysellNew column (via onLayout below) - passed to
  // OrderBookStacked as a cap so its generous fixed height never extends past
  // where the Buy/Sell button ends, regardless of device size.
  const [buysellColumnHeight, setBuysellColumnHeight] = useState<number | undefined>(undefined);

  // Rendered in-place (not via a stack push) so the bottom tab bar stays visible.
  if (showFullChart) {
    return (
      <FullViewChart
        ticker={futureTicker?.tickerRoot}
        onBack={() => setShowFullChart(false)}
        // Tapping the pair name from inside Chart should land straight on
        // Market's list (same as tapping it from Future itself), not just one
        // level back up to this Future screen - close both swaps at once.
        onSelectPair={() => {
          setShowFullChart(false);
          (onSelectPairFromChart ?? onBack)?.();
        }}
      />
    );
  }

  return (
    <Mainview
      isheader={false}
      isbottomtab={true}
      isscollable={true}
      iskeyboardaware={Platform.OS !== "ios"}
      isnestedscrollable={true}
      horizontalpadding={0}
      gradientColors={theme.theme === "dark" ? ["#0F2F5E", "#1438187e", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
      gradientLocations={[0, 0.45, 1]}
    >
      {/* minHeight forces this whole block (header through the order book/buy-sell
          row) to occupy at least the full visible viewport, so "Position/Recent
          Trades" below it never creeps into view on the first screen regardless of
          how short the auto-fit order book/form content ends up on a given device -
          it stays a deliberate second page you scroll down to, on every device.
          visibleViewportHeight (not raw windowheight) so this doesn't overshoot past
          the status bar/bottom tab bar and leave a dead gap before the tab bar. */}
      <View style={{ minHeight: visibleViewportHeight }}>
      <View style={{ flexShrink: 0, paddingHorizontal: "3%" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: RFvalue(6),
            marginTop: RFvalue(6),
          }}
        >
          <Pressable
            style={{ flexDirection: "row", alignItems: "center", marginLeft: "2%" }}
            onPress={() => onBack?.()}

          >
            {Platform.OS === "ios" &&
              <VectorIcons
                family="Ionicons"
                name="chevron-back"
                size={RFvalue(20)}
                style={{ marginRight: 4 }}
              />}
            <Text style={{ color: theme.primarytext, fontFamily: Fontfamily.medium, fontSize: RFvalue(16) }}
            >
              Futures
            </Text>
          </Pressable>
        </View>

        {/* <Flexcomponent alignItems="center">
          
          <Currencyselect
            currency={futureTicker?.tickerRoot}
            descrption="PERPETUALS"
            currencyicon={getTokenImage(futureTicker?.tickerRoot)}
            onselect={() => onBack?.()}

          />
          <View
            style={{
              width: "47%",
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            <Text
              style={{ textAlign: "center" }}
              color={theme.secondarytext}
              fontSize={RFvalue(13)}
              family="medium"
            >
              Up to{" "}
              {futureTradePair?.max_leverage === ""
                ? 100
                : futureTradePair?.max_leverage}
              x Leverage
            </Text>

            <Pressable style={{ marginTop: "6%" }} onPress={() => setShowChart(!showChart)}>
              <LinearGradient
                colors={showChart ? theme.theme == 'dark' ? ["#0d4195", "#2c24247a"] : ["#2563EB", "#2563EB"] : theme.theme == 'dark' ? ["#081730", "#000000"] : ["#D9D9D9", "#D9D9D9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: borderradius * 3, paddingVertical: "4%", paddingHorizontal: "15%", alignItems: "center", borderWidth: 0.8, borderColor: "#F1F5F9", flexDirection: "row", gap: 10 }}
              >
                <Text family="medium" style={{
                  color: showChart && theme.theme === "light" ? "#FFFFFF" : theme.theme == 'dark' ? "#ffff" : undefined
                }}>Chart</Text>
                <Images
                  type="svg"
                  name={theme.theme == 'dark' ? "ChartTabIcon" : "ChartTabIconLight"}
                  width={15}
                  height={15}
                  style={{ marginBottom: 4 }}
                />
              </LinearGradient>
            </Pressable>
          </View>
        </Flexcomponent>

        <Flexcomponent
          justifyContent="space-between"
          style={{
            marginTop: "2%",
            borderRadius: borderradius * 0.5,
            // width: "50%",
            borderWidth: 0.8,
            borderColor: "#1B2740"
          }}
          paddingHorizontal={"2%"}
          height={windowheight * 0.08}
          bakgroundcolor={theme.theme == 'dark' ? "#151a1759" : "#FFFFFF"}
        >
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={{ width: "100%" }}
            contentContainerStyle={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={styles.pricecontainer}>
              <Text
                fontSize={RFvalue(12.5)}
                family="semiBold"
                numoflines={1}
                color={dirColor(futureTicker?._dir, theme.homegreen)}
              >
                {futureTicker?.marketPrice}
              </Text>
              <Text
                fontSize={RFvalue(10.5)}
                numoflines={1}
                color={theme.textNobel}
              >
                {isNaN(futureTicker?.change) ? 0 : futureTicker?.change?.toFixed(2)}
              </Text>
            </View>
            <View style={styles.pricecontainer}>
              <Text
                fontSize={RFvalue(12)}
                family="semiBold"
                numoflines={1}
                color={theme.secondarytext}
              >
                24h Change
              </Text>
              <Text
                fontSize={RFvalue(11.5)}
                numoflines={1}
                color={futureTicker?.changePrice > 0 ? theme.profit : Colors.red}
              >
                {futureTicker?.changePrice} ( {futureTicker?.change}%)
              </Text>
            </View>
            <View style={styles.pricecontainer}>
              <Text
                fontSize={RFvalue(11.5)}
                numoflines={1}
                family="semiBold"
                color={theme.secondarytext}
              >
                24h High
              </Text>
              <Text
                fontSize={RFvalue(11.5)}
                numoflines={1}
                color={theme.futuretext}
              >
                {futureTicker?.high} ( {futureTicker?.percent24High}%)
              </Text>
            </View>
            <View style={styles.pricecontainer}>
              <Text
                fontSize={RFvalue(11.5)}
                numoflines={1}
                family="semiBold"
                color={theme.secondarytext}
              >
                24h Low
              </Text>
              <Text
                fontSize={RFvalue(11.5)}
                numoflines={1}
                color={theme.futuretext}
              >
                {futureTicker?.low} ( {futureTicker?.percent24Low}%)
              </Text>
            </View>
            <View style={styles.pricecontainer}>
              <Text
                fontSize={RFvalue(11.5)}
                numoflines={1}
                family="semiBold"
                color={theme.secondarytext}
              >
                24h Volume ({futureTradePair?.baseCurrency})
              </Text>
              <Text
                fontSize={RFvalue(11.5)}
                numoflines={1}
                color={theme.futuretext}
              >
                {futureTicker?.volume}
              </Text>
            </View>
            <View style={styles.pricecontainer}>
              <Text
                fontSize={RFvalue(11.5)}
                numoflines={1}
                family="semiBold"
                color={theme.secondarytext}
              >
                24h Volume ({futureTradePair?.quoteCurrency})
              </Text>
              <Text
                fontSize={RFvalue(11.5)}
                numoflines={1}
                color={theme.futuretext}
              >
                {futureTicker?.deal}
              </Text>
            </View>
          </ScrollView>
        </Flexcomponent> */}

        <View style={{ width: "100%", marginTop: "3%" }}>
          {/* ================= TOP ROW: PAIR + LEVERAGE/CHART ================= */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              width: "100%",
            }}
          >
            {/* ================= CURRENCY SELECT ================= */}
            <View
              style={{
                width: windowwidth * 0.36,
              }}
            >
              <Currencyselect
                currency={formatDisplayPair(futureTicker?.tickerRoot)}
                descrption="PERPETUALS"
                width="100%"
                // Reverted to the default height (was shrunk to 0.06 to reclaim
                // vertical space on short devices) - the icon/two-line text/chevron
                // inside are proportioned for the default box size, and the shorter
                // height cramped them into a messy-looking pair selector instead.
                // This screen already reclaimed the space it needs elsewhere
                // (header title, stats bar, section margins) without touching this.
                // This screen is reached as a plain component swap from Market
                // (market.tsx's `showFuture` state), not a pushed navigator route -
                // `navigation.navigate("Market", ...)` was a no-op since we're
                // already inside Market's component tree. `onBack` is what actually
                // unwinds the swap back to Market's pair list; picking a pair there
                // already re-opens this screen for it via handleOpenFuture.
                onselect={() => onBack?.()}
              />
            </View>

            {/* ============ RIGHT SIDE: LEVERAGE + CHART ============ */}
            {/* Same minHeight as the pair card so the Chart button
                bottom-aligns with it instead of orphaning its own row. */}
            <View
              style={{
                flex: 1,
                minHeight: windowheight * 0.075,
                justifyContent: "space-between",
                alignItems: "flex-end",
                paddingLeft: 12,
              }}
            >
              {/* ================= LEVERAGE ================= */}
              <Text
                style={{
                  textAlign: "right",
                  lineHeight: RFvalue(16),
                }}
                color={theme.secondarytext}
                fontSize={RFvalue(12)}
                family="medium"
                numoflines={2}
              >
                Up to{" "}
                {futureTradePair?.max_leverage === ""
                  ? 100
                  : futureTradePair?.max_leverage}
                x Leverage
              </Text>

              {/* ================= CHART BUTTON ================= */}
              <Pressable
                onPress={() => setShowFullChart(true)}
                style={{ marginTop: 8 }}
              >
                <LinearGradient
                  colors={
                    showFullChart
                      ? theme.theme === "dark"
                        ? ["#0d4195", "#2c24247a"]
                        : ["#2563EB", "#2563EB"]
                      : theme.theme === "dark"
                        ? ["#081730", "#000000"]
                        : ["#D9D9D9", "#D9D9D9"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: borderradius * 3,
                    paddingVertical: 6,
                    paddingHorizontal: 16,
                    alignItems: "center",
                    borderWidth: 0.8,
                    borderColor:
                      theme.theme === "dark"
                        ? "#F1F5F9"
                        : "#D0D0D0",
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <Text
                    family="medium"
                    style={{
                      color:
                        showFullChart
                          ? "#FFFFFF"
                          : theme.theme === "dark"
                            ? "#FFFFFF"
                            : theme.primarytext,
                    }}
                  >
                    Chart
                  </Text>

                  <Images
                    type="svg"
                    name={!showFullChart ?
                      theme.theme === "dark"
                        ? "ChartTabIcon"
                        : "ChartTabIconLight" : "ChartTabWhiteIcon"
                    }
                    width={15}
                    height={15}
                    style={{
                      marginBottom: 2,
                    }}
                  />
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* ================= STATS BAR (full width) ================= */}
          {/* letterSpacing trimmed (0.8 -> 0.3) and adjustsFontSizeToFit added to every
              label/value here - on a narrow device (iPhone mini) "24H CHANGE" in
              particular was wide enough to get silently ellipsized ("24H CHAN...")
              inside its 1/4-width flex column. adjustsFontSizeToFit shrinks the text
              just enough to keep it on one line and fully readable instead of cutting
              it off, without changing the wording or breaking wider screens (where it
              simply never needs to shrink). */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginTop: RFvalue(9),
              width: "100%",
              backgroundColor:
                theme.theme === "dark"
                  ? "#151a1759"
                  : "#FFFFFF",
              borderRadius: borderradius * 0.5,
              paddingVertical: RFvalue(8),
              paddingHorizontal: RFvalue(8),
              borderWidth: 1,
              borderColor: "#1B2740",
            }}
          >
            {/* INDEX PRICE */}
            <View style={{ flex: 1 }}>
              <Text
                fontSize={RFvalue(10)}
                family="medium"
                color={theme.secondarytext}
                style={{
                  letterSpacing: 0.3,
                }}
                numoflines={1}
                textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.7 }}
              >
                INDEX PRICE
              </Text>

              <Text
                fontSize={RFvalue(12)}
                family="medium"
                color={theme.futuretext}
                style={{
                  marginTop: 5,
                }}
                numoflines={1}
                textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.7 }}
              >
                ${futureTicker?.indexPrice || "0.00"}
              </Text>
            </View>

            {/* MARK PRICE */}
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                fontSize={RFvalue(10)}
                family="medium"
                color={theme.secondarytext}
                style={{
                  letterSpacing: 0.3,
                }}
                numoflines={1}
                textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.7 }}
              >
                MARK PRICE
              </Text>

              <Text
                fontSize={RFvalue(12)}
                family="medium"
                color={dirColor(futureTicker?._dir, theme.futuretext)}
                style={{
                  marginTop: 5,
                }}
                numoflines={1}
                textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.7 }}
              >
                ${futureTicker?.marketPrice || "0.00"}
              </Text>
            </View>

            {/* 24H CHANGE */}
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                fontSize={RFvalue(10)}
                family="medium"
                color={theme.secondarytext}
                style={{
                  letterSpacing: 0.3,
                }}
                numoflines={1}
                textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.7 }}
              >
                24H CHANGE
              </Text>

              <Text
                fontSize={RFvalue(12)}
                family="medium"
                color={Number(futureTicker?.change ?? 0) >= 0 ? Colors.green : Colors.red}
                style={{
                  marginTop: 5,
                }}
                numoflines={1}
                textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.7 }}
              >
                {Number(futureTicker?.change ?? 0) >= 0 ? "+" : ""}{futureTicker?.change ?? "0.00"}%
              </Text>
            </View>

            {/* OI - same field/format as web's ticker bar (futureTicker.openInterest,
            parsed as a float, 2 decimals). Backend doesn't broadcast a correct
            value for this yet (see futureController.js positionMatching's
            updateOpenInterest calls - wrong-variable bugs there make the stored
            value drift to garbage, and it's not in the FututresPrice payload at
            all yet), so this reads as "0.00" until that's fixed - not a fake
            static number, the real field with an honest fallback. */}
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                fontSize={RFvalue(10)}
                family="medium"
                color={theme.secondarytext}
                style={{
                  letterSpacing: 0.3,
                }}
                numoflines={1}
                textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.7 }}
              >
                OI
              </Text>

              <Text
                fontSize={RFvalue(12)}
                family="medium"
                color={theme.futuretext}
                style={{
                  marginTop: 5,
                }}
                numoflines={1}
                textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.7 }}
              >
                {isNaN(parseFloat(futureTicker?.openInterest)) ? "0.00" : parseFloat(futureTicker?.openInterest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* {showChart &&
        <View>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            marginTop: "5%",
            // gap: 8,
          }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              borderWidth: 1,
              borderColor: Colors.brand,
              borderRadius: 5,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}>
              <Text family="medium" style={{ color: Colors.brand, fontSize: RFvalue(10) }}>Traded Price</Text>
              <VectorIcons family="FontAwesome" name="sort" size={RFvalue(10)} iconcolor={Colors.brand} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginLeft: "auto" }} contentContainerStyle={{ gap: 5, alignItems: "center" }}>
              {chartIntervals.map((iv) => {
                const active = chartInterval === iv;
                return (
                  <Pressable
                    key={iv}
                    onPress={() => setChartInterval(iv)}
                    style={{
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: active ? (Colors.brand) : (theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"),
                      backgroundColor: active ? (theme.theme == 'dark' ? "#101A2C" : "#FFFFFF") : (theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"),
                    }}
                  >
                    <Text family="regular" style={{ color: active ? theme.primarytext : theme.secondarytext, fontSize: RFvalue(10) }}>{iv}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={{
            width: "100%",
            height: windowheight * 0.40,
          }}
          >
            <Chart ticker={futureTicker?.tickerRoot} interval={chartInterval} />
          </View>
        </View>
      } */}
      {/* Order book keeps a generous fixed height (see orderbookstacked.tsx), but
          capped by this measured BuysellNew column height so it never extends
          past the Buy/Sell button into the tabs below on a device where the
          form ends up shorter than that fixed height. */}
      {/* paddingHorizontal matches the header block's own "3%" inset above, so the order
          book/form content doesn't sit flush against the screen edges the way it did with
          none here - the two columns' 42%/58% split still holds relative to this now-
          slightly-narrower content box, so this alone gives both a left and right gap. */}
      <View style={{ flexDirection: "row", width: "100%", alignItems: "flex-start", paddingHorizontal: "3%" }}>
        <View style={{ width: "42%", marginTop: RFvalue(6) }}>
          <OrderBookStacked
            currentIndex={futureTradePair?._id}
            tickerRoot={futureTicker?.tickerRoot}
            maxHeight={buysellColumnHeight}
          />
        </View>

        <View
          style={{ width: "58%", marginTop: RFvalue(6) }}
          onLayout={(e) => setBuysellColumnHeight(e.nativeEvent.layout.height)}
        >
          <BuysellNew />
        </View>
      </View>
      </View>

      {/* position and recent trade table  */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-around",
        borderBottomWidth: 2,
        borderBottomColor: theme.theme === "dark" ? Colors.dune : theme.boderColor,
        marginTop: 10,
        position: "relative",
      }}>
        <ScrollView
          ref={scrollRef}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={{ marginRight: 30 }}>

          {tabs.map((tab) => (
            <Pressable
              key={tab}
              onLayout={(e) => { tabLayouts.current[tab] = e.nativeEvent.layout.x }}
              onPress={() => {
                scrollRef.current?.scrollTo({
                  x: tabLayouts.current[tab] || 0,
                  animated: true,
                });

                // dispatch(setCancelOrders({ cancelOrdersList: [], cancelType: '' }))
                // dispatch(setPairsList({
                //   pairsList: []
                // }))
                setActiveTab(tab)
              }}
              style={{
                alignItems: "center",
                paddingHorizontal: 20,
                marginBottom: 10
              }}
              hitSlop={20}
            >
              <Text family="medium" style={[{ color: activeTab === tab ? theme.darktext : Colors.grey }]}>{tab}</Text>
              {activeTab === tab && <View style={{
                height: 2,
                backgroundColor: theme.darktext,
                width: windowwidth * 0.10,
                borderRadius: 1,
                position: "absolute",
                bottom: -10,
              }} />}
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={{ flex: 1 }}>
        {/* Both tab panels stay mounted and are only visually toggled, so the outer
            ScrollView's scroll offset is preserved when switching between them
            (a conditional mount/unmount collapses the content height and makes the
            scroll position jump). */}
        <View style={{ flex: 1, display: activeTab === "Position" ? "flex" : "none" }}>
          <Positions
            tab="Positions"
            active="Futures"
            futureId={embeddedFutureId}
            tradeMode="future"
            showFilter={false}
            nestedInScrollView={true}
          />
        </View>
        <View style={{ flex: 1, display: activeTab === "Recent Trades" ? "flex" : "none" }}>
          <RecentTrades />
        </View>
      </View>
    </Mainview >
  );
};

export default Future;