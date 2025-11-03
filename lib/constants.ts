import { CategoryDB } from "@/db/schema";
import { IconWithColor, LanguageOption, PaymentMethod } from "./types";

type CategoryData = Omit<CategoryDB, 'type' | 'enabled' | 'isCustom'>

export const DefaultExpenseCategories: CategoryData[] = [
    {
        name: "food",
        label: "Food",
        icon: "food",
        color: "#e6401bff"
    },
    {
        name: "transport",
        label: "Transport",
        icon: "train-car",
        color: "#F76C6C"
    },
    {
        name: "entertainment",
        label: "Entertainment",
        icon: "movie",
        color: "#68c0a3ff"
    },
    {
        name: "shopping",
        label: "Shopping",
        icon: "shopping",
        color: "#edab1dff"
    },
    {
        name: "health",
        label: "Health",
        icon: "heart",
        color: "#daa3daff"
    },
    {
        name: "travel",
        label: "Travel",
        icon: "walk",
        color: "#ef877aff"
    },
    {
        name: "bills",
        label: "Bills",
        icon: "file-document",
        color: "#823bc0ff"
    },
    {
        name: "other",
        label: "Other",
        icon: "dots-horizontal-circle-outline",
        color: "#17b4edff"
    }
]


export const DefaultIncomeSources: CategoryData[] = [
    {
        name: "salary",
        label: "Salary",
        icon: "cash",
        color: "#8BC34A"
    },
    {
        name: "business",
        label: "Business",
        icon: "briefcase",
        color: "#4FC3F7"
    },
    {
        name: "freelance",
        label: "Freelance",
        icon: "laptop",
        color: "#7141f5ff"
    },
    {
        name: "rental",
        label: "Rental",
        icon: "home",
        color: "#E57373"
    },
    {
        name: "investment",
        label: "Investment",
        icon: "chart-line",
        color: "#9575CD"
    },
    {
        name: "gift",
        label: "Gift",
        icon: "gift",
        color: "#ff9021ff"
    },
    {
        name: "bonus",
        label: "Bonus",
        icon: "star",
        color: "#F06292"
    },
    {
        name: "refund",
        label: "Refund",
        icon: "undo",
        color: "#A1887F"
    },
    {
        name: "pension",
        label: "Pension",
        icon: "account-tie",
        color: "#90A4AE"
    },
    {
        name: "other",
        label: "Other",
        icon: "dots-horizontal-circle-outline",
        color: "#17b4edff"
    }
];


export const paymentMethods: PaymentMethod[] = [
    {
        name: "upi",
        label: "UPI",
        icon: "qrcode-scan"
    },
    {
        name: "cash",
        label: "Cash",
        icon: "cash"
    },
    {
        name: "bank-transfer",
        label: "Bank Transfer",
        icon: "bank"
    },
    {
        name: "credit-card",
        label: "Credit Card",
        icon: "credit-card"
    },
    {
        name: "other",
        label: "Other",
        icon: "dots-horizontal"
    }
];

export const paymentMethodsMapping = paymentMethods.reduce((acc, paymentMethod) => {
    acc[paymentMethod.name] = paymentMethod;
    return acc;
}, {} as Record<string, PaymentMethod>);



export const ICON_COLORS: IconWithColor[] = [
    // Existing icons/colors from your categories
    { icon: 'food', color: '#e6401bff' },
    { icon: 'train-car', color: '#F76C6C' },
    { icon: 'movie', color: '#68c0a3ff' },
    { icon: 'shopping', color: '#edab1dff' },
    { icon: 'heart', color: '#daa3daff' },
    { icon: 'walk', color: '#ef877aff' },
    { icon: 'file-document', color: '#823bc0ff' },

    // Existing icons/colors from your sources
    { icon: 'cash', color: '#8BC34A' },
    { icon: 'briefcase', color: '#4FC3F7' },
    { icon: 'laptop', color: '#7141f5ff' },
    { icon: 'home', color: '#E57373' },
    { icon: "chart-line", color: "#9575CD" },
    { icon: 'gift', color: '#ff9021ff' },
    { icon: 'star', color: '#F06292' },
    { icon: "undo", color: "#A1887F" },
    { icon: "account-tie", color: "#90A4AE" },
    { icon: 'dots-horizontal-circle-outline', color: '#17b4edff' },


    // New colors & icons
    { icon: 'credit-card', color: '#4caed4ff' },
    { icon: 'bank', color: '#739dd3ff' },
    { icon: 'wallet', color: '#F7DC6F' },
    { icon: 'piggy-bank', color: '#F1948A' },
    { icon: 'currency-usd', color: '#85C1E9' },
    { icon: 'currency-eur', color: '#88e6aeff' },
    { icon: 'currency-gbp', color: '#f87a71ff' },
    { icon: 'currency-inr', color: '#bf7fdbff' },
    { icon: 'hand-coin', color: '#eb925eff' },
    { icon: 'safe', color: '#AED6F1' },

    { icon: 'store', color: '#edba66ff' },
    { icon: 'cart', color: '#63b8a7ff' },
    { icon: 'receipt', color: '#D5A6BD' },
    { icon: 'sale', color: '#fcdd65ff' },
    { icon: 'card-account-details', color: '#85C1E9' },

    { icon: 'coffee', color: '#d2a88cff' },
    { icon: 'pizza', color: '#FF9999' },
    { icon: 'hamburger', color: '#DEB887' },
    { icon: 'silverware', color: '#B0C4DE' },
    { icon: 'glass-wine', color: '#DDA0DD' },
    { icon: 'tea', color: '#90EE90' },

    { icon: 'car', color: '#87CEFA' },
    { icon: 'gas-station', color: '#9e9759ff' },
    { icon: 'bus', color: '#FFA07A' },
    { icon: 'train', color: '#de6449ff' },
    { icon: 'airplane', color: '#71c3dfff' },
    { icon: 'taxi', color: '#5f81cdff' },
    { icon: 'bicycle', color: '#6bbf6bff' },
    { icon: 'parking', color: '#D8BFD8' },

    { icon: 'lightbulb', color: '#ebd064ff' },
    { icon: 'water', color: '#7FB3D3' },
    { icon: 'fire', color: '#F1948A' },
    { icon: 'power-plug', color: '#73cf41ff' },
    { icon: 'phone', color: '#80bde5ff' },
    { icon: 'wifi', color: '#82E0AA' },
    { icon: 'fuel', color: '#FAD7A0' },

    { icon: 'medical-bag', color: '#FF6B6B' },
    { icon: 'pill', color: '#4ECDC4' },
    { icon: 'hospital', color: '#45B7D1' },
    { icon: 'tooth', color: '#96CEB4' },
    { icon: 'eye', color: '#c9b269ff' },
    { icon: 'stethoscope', color: '#DDA0DD' },

    { icon: 'music', color: '#7fdcbaff' },
    { icon: 'gamepad-variant', color: '#f79ca5ff' },
    { icon: 'television', color: '#BFBFFF' },
    { icon: 'camera', color: '#f8cc99ff' },
    { icon: 'book-open', color: '#a5a527ff' },
    { icon: 'football', color: '#80c7fdff' },
    { icon: 'theater', color: '#F0B3FF' },

    { icon: 'school', color: '#a5b4f0ff' },
    { icon: 'book', color: '#87a456ff' },
    { icon: 'printer', color: '#9ed096ff' },

    { icon: 'face-man', color: '#d47372ff' },
    { icon: 'spa', color: '#6c6ce2ff' },
    { icon: 'glasses', color: '#4a97a1ff' },
    { icon: 'watch', color: '#aca249ff' },
    { icon: 'tshirt-crew', color: '#c86776ff' },

    { icon: 'heart-outline', color: '#F8BBD9' },
    { icon: 'gift-outline', color: '#F5B7B1' },
    { icon: 'bell', color: '#F7DC6F' },
    { icon: 'flag', color: '#61a9daff' },
    { icon: 'shield', color: '#7dddb0ff' }
] as const;


export const themeOptions = [
    {
        key: "light" as const,
        label: "Light",
        icon: "weather-sunny",
        description: "Always use light theme",
    },
    {
        key: "dark" as const,
        label: "Dark",
        icon: "weather-night",
        description: "Always use dark theme",
    },
    {
        key: "system" as const,
        label: "System",
        icon: "theme-light-dark",
        description: "Follow system preference",
    },
];


export const LANGUAGE_OPTIONS: LanguageOption[] = [
    {
        key: "english",
        label: "English",
        description: "Default language",
        available: true,
    },
    {
        key: "hindi",
        label: "हिन्दी (Hindi)",
        description: "Coming soon",
        available: false,
    },
    {
        key: "spanish",
        label: "Español (Spanish)",
        description: "Coming soon",
        available: false,
    },
];

export const MinimumItemsToLoadForScroll = 20;