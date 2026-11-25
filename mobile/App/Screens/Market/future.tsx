// import React, { useCallback, useContext } from "react";
// import { FlatList, TouchableOpacity, View } from "react-native";
// import { useSelector } from "react-redux";

// import Text from "../../Components/text";
// import NoData from "../../Components/Nodata";
// import { Colors } from "../../Utilities/uiasset";
// import VectorIcons from "../../Utilities/vectoricons";
// import ThemeContext from "../../Utilities/themecontext";
// import Flexcomponent from "../../Components/flexcomponent";
// import { windowheight, windowwidth } from "../../Utilities/dimensions";
// import { formatDisplayPair } from "../../Utilities/formatPair";

// interface Marketfutureprops {
//     pairData?: any;
//     onSelect?: any;
//     addFavourite?: any;
//     favourite?: any;
//     isFavourite?: boolean;
//     onOpenFuture?: (tickerRoot: string) => void; // NEW: component-swap callback
//     favouriteLoadingId?: string | null;
// }

// const toFixed2 = (v: any) => {
//     const n = Number(v);
//     return Number.isFinite(n) ? n.toFixed(2) : "0.00";
// };

// // Price text colour: 'up' -> green, 'down' -> red, otherwise neutral.
// const dirColor = (dir: any, neutral: any) =>
//     dir === "up" ? Colors.green : dir === "down" ? Colors.red : neutral;

// // 24h change colour: by sign.
// const changeColor = (v: any) => (Number(v) >= 0 ? Colors.green : Colors.red);

// /**
//  * One market-list row. It subscribes to ONLY its own pair's entry in
//  * state.future.livePrices, so a price tick for BTCUSDT re-renders the BTC row and
//  * nothing else - the list container and the other 149 rows stay untouched. The
//  * static `item` (name / id / decimals) comes from the pair list and rarely
//  * changes; the live numbers are read from the map and fall back to `item`.
//  */
// interface PairRowProps {
//     item: any;
//     favourite?: any;
//     favouriteLoadingId?: string | null;
//     addFavourite?: any;
//     onOpen: (tickerRoot: string) => void;
//     theme: any;
// }

// const PairRow: React.FC<PairRowProps> = React.memo(({
//     item,
//     favourite,
//     favouriteLoadingId,
//     addFavourite,
//     onOpen,
//     theme,
// }) => {
//     const live = useSelector((s: any) => s.future.livePrices?.[item.tickerRoot]);

//     const marketPrice = live?.marketPrice ?? item.marketPrice;
//     const last = live?.last ?? item.last;
//     const change = live?.change ?? item.change;
//     const volume = live?.volume ?? item.volume;
//     const priceColor = dirColor(live?._dir, theme.futuretext);
//     const isFav = favourite?.some((val: any) => val.pairName === item.tickerRoot);

//     return (
//         <Flexcomponent
//             onPress={() => onOpen(item.tickerRoot)}
//             ispress={true}
//             style={{ marginVertical: "2.5%" }}
//             height={windowheight * 0.05}
//             width={"100%"}
//         >
//             <Flexcomponent alignItems="center" justifyContent="space-around" style={{ width: "25%" }}>
//                 <TouchableOpacity
//                     style={{ alignItems: "center", flexDirection: "row" }}
//                     disabled={favouriteLoadingId === item._id}
//                     onPress={() => addFavourite(item._id, item.tickerRoot)}
//                 >
//                     <View>
//                         <VectorIcons
//                             family="FontAwesome"
//                             name={isFav ? "star" : "star-o"}
//                             size={windowwidth * 0.040}
//                             iconcolor={isFav ? "#FDD25A" : theme.darktext}
//                         />
//                     </View>
//                 </TouchableOpacity>
//                 <View>
//                     <Text size="xsmall" color={theme.futuretext} numoflines={1}>  {formatDisplayPair(item.tickerRoot)}</Text>
//                     <Text size="xsmall" color={priceColor}>  {toFixed2(marketPrice)}</Text>
//                 </View>
//             </Flexcomponent>

//             <View style={{ width: "25%", justifyContent: "center", alignItems: "flex-end", paddingRight: 4 }}>
//                 <Text size="xsmall" color={priceColor}>{last}</Text>
//             </View>

//             <View style={{ width: "22%", justifyContent: "center", alignItems: "flex-end" }}>
//                 <Text size="xsmall" color={changeColor(change)}>{change}</Text>
//             </View>
//             <View style={{ width: "28%", justifyContent: "center", alignItems: "flex-end" }}>
//                 <Text size="xsmall" color={theme.darktext}>{volume}</Text>
//             </View>
//         </Flexcomponent>
//     );
// });

// const rowKey = (item: any) => (item?._id ?? item?.tickerRoot ?? "");

// const Marketfuture: React.FC<Marketfutureprops> = ({
//     pairData,
//     onSelect,
//     addFavourite,
//     favourite,
//     isFavourite,
//     onOpenFuture,
//     favouriteLoadingId,
// }) => {
//     const theme = useContext(ThemeContext);

//     const handleOpen = useCallback((tickerRoot: string) => {
//         onSelect?.(tickerRoot);
//         // Component swap instead of navigation.navigate("Future") — keeps us inside
//         // the Market tab, so the bottom tab bar stays visible.
//         onOpenFuture?.(tickerRoot);
//     }, [onSelect, onOpenFuture]);

//     const renderItem = useCallback(({ item }: { item: any }) => (
//         <PairRow
//             item={item}
//             favourite={favourite}
//             favouriteLoadingId={favouriteLoadingId}
//             addFavourite={addFavourite}
//             onOpen={handleOpen}
//             theme={theme}
//         />
//     ), [favourite, favouriteLoadingId, addFavourite, handleOpen, theme]);

//     return (
//         <View style={{ flex: 1 }}>
//             <Flexcomponent style={{ paddingHorizontal: "2.5%", marginTop: "2%" }} paddingVertical={"2.5%"} width={"100%"}>
//                 <Flexcomponent style={{ width: "25%", justifyContent: "flex-start" }}>
//                     <Text size="semimedium" family="medium" color={theme.graytext}>Name</Text>
//                 </Flexcomponent>

//                 <Flexcomponent justifyContent="flex-end" style={{ width: "25%" }}>
//                     <Text size="semimedium" family="medium" color={theme.graytext}>Last Price</Text>
//                 </Flexcomponent>

//                 <Flexcomponent justifyContent="flex-end" style={{ width: "22%" }}>
//                     <Text size="semimedium" family="medium" color={theme.graytext}>24 Chg.</Text>
//                 </Flexcomponent>

//                 <Flexcomponent justifyContent="flex-end" style={{ width: "28%" }}>
//                     <Text size="semimedium" family="medium" color={theme.graytext}>24h Vol.</Text>
//                 </Flexcomponent>
//             </Flexcomponent>

//             <View style={{ flex: 1, paddingHorizontal: "2.5%" }}>
//                 {pairData.length > 0 ? (
//                     <FlatList
//                         data={pairData}
//                         keyExtractor={rowKey}
//                         showsVerticalScrollIndicator={false}
//                         renderItem={renderItem}
//                         removeClippedSubviews
//                         initialNumToRender={12}
//                         maxToRenderPerBatch={10}
//                         windowSize={9}
//                     />
//                 ) : (
//                     <View style={{ alignItems: "center", justifyContent: "center", marginTop: "20%" }} >
//                         <NoData title="No Record Found!" />
//                     </View>
//                 )}
//             </View>
//         </View>
//     );
// };

// export default React.memo(Marketfuture);
import React, { useCallback, useContext } from "react";
import {
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";

import Text from "../../Components/text";
import NoData from "../../Components/Nodata";
import { Colors } from "../../Utilities/uiasset";
import VectorIcons from "../../Utilities/vectoricons";
import ThemeContext from "../../Utilities/themecontext";
import Flexcomponent from "../../Components/flexcomponent";
import {
  windowheight,
  windowwidth,
} from "../../Utilities/dimensions";
import { formatDisplayPair } from "../../Utilities/formatPair";

interface Marketfutureprops {
  pairData?: any[];
  onSelect?: any;
  addFavourite?: any;
  favourite?: any;
  isFavourite?: boolean;
  onOpenFuture?: (tickerRoot: string) => void;
  favouriteLoadingId?: string | null;
}

/* ================================================================
   HELPERS
================================================================ */

const toFixed2 = (v: any) => {
  const n = Number(v);

  return Number.isFinite(n)
    ? n.toFixed(Math.abs(n) >= 1000 ? 2 : Math.abs(n) >= 10 ? 3 : 5)
    : "0.00";
};

const dirColor = (
  dir: any,
  neutral: any
) => {
  if (dir === "up") {
    return Colors.brand;
  }

  if (dir === "down") {
    return Colors.red;
  }

  return neutral;
};

const changeColor = (v: any) => {
  return Number(v) >= 0
    ? Colors.brand
    : Colors.red;
};

/* ================================================================
   PAIR ROW
================================================================ */

interface PairRowProps {
  item: any;
  isFavouriteLoading?: boolean;
  addFavourite?: any;
  onOpen: (tickerRoot: string) => void;
  theme: any;
}

const PairRow: React.FC<PairRowProps> = React.memo(
  ({
    item,
    isFavouriteLoading,
    addFavourite,
    onOpen,
    theme,
  }) => {
    /*
     * LIVE PRICE DATA
     * ----------------
     * Backend/live Redux functionality is unchanged.
     */
    const live = useSelector(
      (s: any) =>
        s.future.livePrices?.[item.tickerRoot]
    );

    const marketPrice =
      live?.marketPrice ??
      item.marketPrice;

    const last =
      live?.last ??
      item.last;

    const change =
      live?.change ??
      item.change;

    const volume =
      live?.volume ??
      item.volume;

    const priceColor = dirColor(
      live?._dir,
      theme.futuretext
    );

    // Per-row derived boolean (not a shared `favourite` array prop) so that
    // favouriting one pair doesn't force every OTHER visible row to re-render
    // too - same fix pattern as `live` above, matching this file's prior
    // "fresh-reference-per-render" smoothness fixes elsewhere in the app.
    const isFav = useSelector(
      (s: any) =>
        !!s.auth.userData?.futureFav?.some(
          (val: any) => val.pairName === item.tickerRoot
        )
    );

    return (
      <Flexcomponent
        onPress={() =>
          onOpen(item.tickerRoot)
        }
        ispress={true}
        height={windowheight * 0.05}
        width="100%"
        style={{
          /*
           * Keep the original row spacing.
           */
          marginTop: "2.5%",

          /*
           * No bottom margin.
           */
          marginBottom: 0,

          paddingBottom: 0,
        }}
      >
        {/* ======================================================
            NAME
        ====================================================== */}

        <Flexcomponent
          alignItems="center"
          justifyContent="flex-start"
          style={{
            width: "25%",
          }}
        >
          <TouchableOpacity
            style={{
              alignItems: "center",
              flexDirection: "row",
              marginLeft: "2.5%",
            }}
            disabled={isFavouriteLoading}
            onPress={() =>
              addFavourite?.(
                item._id,
                item.tickerRoot
              )
            }
          >
            <VectorIcons
              family="FontAwesome"
              name={
                isFav
                  ? "star"
                  : "star-o"
              }
              size={windowwidth * 0.04}
              iconcolor={
                isFav
                  ? "#FDD25A"
                  : theme.darktext
              }
            />
          </TouchableOpacity>

          <View style={{ marginLeft: "10%" }}>
            <Text
              size="xsmall"
              color={theme.futuretext}
              numoflines={1}
            >
              {" "}
              {formatDisplayPair(
                item.tickerRoot
              )}
            </Text>

            <Text
              size="xsmall"
              color={priceColor}
              numoflines={1}
            >
              {" "}
              {toFixed2(
                marketPrice
              )}
            </Text>
          </View>
        </Flexcomponent>

        {/* ======================================================
            LAST PRICE
        ====================================================== */}

        <View
          style={{
            width: "25%",
            justifyContent: "center",
            alignItems: "flex-end",
            paddingRight: 4,
          }}
        >
          <Text
            size="xsmall"
            color={priceColor}
            numoflines={1}
          >
            {last}
          </Text>
        </View>

        {/* ======================================================
            24H CHANGE
        ====================================================== */}

        <View
          style={{
            width: "22%",
            justifyContent: "center",
            alignItems: "flex-end",
          }}
        >
          <Text
            size="xsmall"
            color={changeColor(change)}
            numoflines={1}
          >
            {change}
          </Text>
        </View>

        {/* ======================================================
            VOLUME
        ====================================================== */}

        <View
          style={{
            width: "28%",
            justifyContent: "center",
            alignItems: "flex-end",
          }}
        >
          <Text
            size="xsmall"
            color={theme.darktext}
            numoflines={1}
          >
            {volume}
          </Text>
        </View>
      </Flexcomponent>
    );
  }
);

/* ================================================================
   KEY
================================================================ */

const rowKey = (
  item: any,
  index: number
) => {
  return String(
    item?._id ??
      item?.tickerRoot ??
      index
  );
};

/* ================================================================
   HEADER
================================================================ */

const MarketHeader: React.FC<{
  theme: any;
}> = ({ theme }) => {
  return (
    <View
      style={{
        width: "100%",
        paddingHorizontal: "2.5%",
        marginTop: "2%",
        marginBottom: 0,
        paddingBottom: 0,
      }}
    >
      <Flexcomponent
        paddingVertical="2.5%"
        width="100%"
      >
        {/* NAME */}

        <Flexcomponent
          style={{
            width: "25%",
            justifyContent: "flex-start",
          }}
        >
          <Text
            size="semimedium"
            family="medium"
            color={theme.graytext}
          >
            Name
          </Text>
        </Flexcomponent>

        {/* LAST PRICE */}

        <Flexcomponent
          justifyContent="flex-end"
          style={{
            width: "25%",
          }}
        >
          <Text
            size="semimedium"
            family="medium"
            color={theme.graytext}
          >
            Last Price
          </Text>
        </Flexcomponent>

        {/* 24 CHG */}

        <Flexcomponent
          justifyContent="flex-end"
          style={{
            width: "22%",
          }}
        >
          <Text
            size="semimedium"
            family="medium"
            color={theme.graytext}
          >
            24 Chg.
          </Text>
        </Flexcomponent>

        {/* VOLUME */}

        <Flexcomponent
          justifyContent="flex-end"
          style={{
            width: "28%",
          }}
        >
          <Text
            size="semimedium"
            family="medium"
            color={theme.graytext}
          >
            24h Vol.
          </Text>
        </Flexcomponent>
      </Flexcomponent>
    </View>
  );
};

/* ================================================================
   MARKET FUTURE
================================================================ */

const Marketfuture: React.FC<
  Marketfutureprops
> = ({
  pairData = [],
  onSelect,
  addFavourite,
  onOpenFuture,
  favouriteLoadingId,
}) => {
  const theme =
    useContext(ThemeContext);

  /* ==============================================================
     OPEN FUTURE
  ============================================================== */

  const handleOpen = useCallback(
    (tickerRoot: string) => {
      /*
       * EXISTING FUNCTIONALITY
       * ----------------------
       * Nothing removed.
       */
      onSelect?.(tickerRoot);

      onOpenFuture?.(tickerRoot);
    },
    [
      onSelect,
      onOpenFuture,
    ]
  );

  /* ==============================================================
     RENDER ITEM
  ============================================================== */

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: any;
    }) => {
      return (
        <PairRow
          item={item}
          isFavouriteLoading={
            favouriteLoadingId === item._id
          }
          addFavourite={
            addFavourite
          }
          onOpen={handleOpen}
          theme={theme}
        />
      );
    },
    [
      favouriteLoadingId,
      addFavourite,
      handleOpen,
      theme,
    ]
  );

  /* ==============================================================
     EMPTY DATA
  ============================================================== */

  if (
    !pairData ||
    pairData.length === 0
  ) {
    return (
      <View
        style={{
          width: "100%",
          margin: 0,
          padding: 0,
        }}
      >
        <MarketHeader
          theme={theme}
        />

        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginTop: "20%",
            padding: 0,
            marginBottom: 0,
          }}
        >
          <NoData
            title="No Record Found!"
          />
        </View>
      </View>
    );
  }

  /* ==============================================================
     MAIN TABLE
  ============================================================== */

  return (
    <View
      style={{
        width: "100%",
        margin: 0,
        padding: 0,

        /*
         * IMPORTANT:
         * Do NOT use flex: 1 here.
         *
         * FlatList needs to determine its own scrollable
         * content correctly.
         */
      }}
    >
      {/* ========================================================
          HEADER
      ======================================================== */}

      <MarketHeader
        theme={theme}
      />

      {/* ========================================================
          TABLE
      ======================================================== */}

      <FlatList
        data={pairData}
        keyExtractor={rowKey}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}

        /*
         * IMPORTANT
         * --------------------------------------------------------
         * flexGrow allows the list to occupy available space,
         * while still allowing all rows to scroll.
         */
        contentContainerStyle={{
          paddingTop: 0,

          /*
           * Small inset so the final row is completely visible.
           *
           * This is NOT backend functionality and does not
           * change your data.
           */
          paddingBottom: windowheight * 0.025,

          margin: 0,
        }}

        /*
         * PERFORMANCE
         */

        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={9}

        /*
         * Keep live Redux updates working normally.
         */
        removeClippedSubviews={false}

        /*
         * Normal native scrolling.
         */
        bounces={true}
        alwaysBounceVertical={false}
        overScrollMode="never"

        /*
         * IMPORTANT:
         * Do not use getItemLayout here.
         *
         * Your rows have percentage spacing, so the previous
         * fixed-height calculation could cause the list to
         * calculate the final scroll position incorrectly.
         */
      />
    </View>
  );
};

export default React.memo(
  Marketfuture
);
