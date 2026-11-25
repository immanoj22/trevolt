import { Colors } from "./uiasset";

export type ThemeType = {
  theme: string;
  background?: string;
  primarytext?: string;
  secondarytext?: string;
  graytext: string;
  textinput?: string;
  darktext?: string
  inversetext?: string;
  bottomheader?: string
  boderColor?: string
  boderlight?: string
  midblack?: string
  card?: string,
  futuretext?: string,
  activetab?: string,
  textNobel?: string
  tabactive?: string,
  activetabtext?: string,
  datebgColor?: string
  homegreen?: string,
  profit?: string,
  futuregreen?: string,
  futurered?: string,
  iconBgColor?: string,
  btnGradient?: string[]
  mutedText?: string,
  mutedTextt?: string,
  infoCardBg?: string,
  infoCardBorder?: string,
  notificationDot?: string,
  heroGradient?: string[],
  actionGradient?: string[],
  tableBorder?: string,
  toggleActive?: string,
  bookBuy?: string,
  bookSell?: string
};

export type ThemeKeyType = 'light' | 'dark';

export type ThemeCollection = {
  light: ThemeType;
  dark: ThemeType;
};

const appProperties = null;

const theme: ThemeCollection = appProperties ? JSON.parse(appProperties)?.theme : {
  light: {
    theme: 'light',
    background: '#FFFFFF',
    primarytext: "#0B1F3A",
    secondarytext: "#1E293B",
    graytext: "#1E293B",
    textinput: "#383838",
    card: "#FFFFFF",
    darktext: "#0B1F3A",
    inversetext: "#0B1F3A",
    bottomheader: "#FFFFFF",
    boderColor: "#E2E8F0",
    boderlight: "#2F2F2F",
    midblack: "#EBEBF599",
    futuretext: "#0B1F3A",
    textNobel: "#475569",
    tabactive: "#0B1F3A",
    activetabtext: "#fcfcff",
    datebgColor: "#E2E8F0",
    homegreen: "#2563EB",
    profit: "#16A34A",
    futuregreen: "#DCFCE7",
    futurered: "#FEE2E2",
    iconBgColor: "#EAF1FF",
    btnGradient: ["#E2E8F0", "#E2E8F0"],
    mutedText: "#0e101180",

    mutedTextt: "#020202f1",
    infoCardBg: "#FFFFFF",
    infoCardBorder: "#E2E8F0",
    notificationDot: "#FF4130",
    heroGradient: ["#DBEAFE", "#F4F8FF", "#F4F8FF"],
    actionGradient: ["#E2E8F0cc", "#E2E8F0cc"],
    tableBorder: "#E2E8F0",
    toggleActive: "#CBD5E1",
    bookBuy: "#00D0B2",
    bookSell: "#FF0066"
  },
  dark: {
    theme: 'dark',
    background: '#0A101C',
    primarytext: "#FFFFFF",
    secondarytext: "#fbfbff99",
    graytext: "#f1f1f1",
    textinput: "#ffffff",
    card: "#131D31",
    darktext: "#ffffff",
    inversetext: "#FFFFFF",
    bottomheader: "#111A2D",
    boderColor: "#1B2740",
    boderlight: "#2F2F2F",
    midblack: "#0A101C",
    futuretext: "#DDDDDF",
    textNobel: "#B5B5B5",
    tabactive: "#fff",
    activetabtext: "#2E2E2E",
    datebgColor: "#292B2F",
    homegreen: "#60A5FA",
    profit: "#2EBD85",
    futuregreen: "#0e1e3c",
    futurered: "#3E1B29",
    iconBgColor: "#EAF1FF",
    btnGradient: ["rgba(10, 22, 44, 0.6)", "rgba(29, 78, 216, 0.55)"],
    mutedText: "#9899A0",
    mutedTextt: "#c9c9ccf1",
    infoCardBg: "#101A2C",
    infoCardBorder: "#1B2740",
    notificationDot: "#FF4130",
    heroGradient: ["#0F3550d7", "#0F3550cc", "#050810"],
    actionGradient: ["rgba(8, 20, 36, 0.6)", "rgba(0, 0, 0, 0.5)"],
    tableBorder: "#222",
    toggleActive: "#4d4a4aee",
    bookBuy: "#00D0B2",
    bookSell: "#FF0066"
  },
};

export default theme;