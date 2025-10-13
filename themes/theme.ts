import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme
} from '@react-navigation/native';
import merge from 'deepmerge';
import {
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from 'react-native-paper';
import colors from './colors';
import Color from 'color';


/**
 * Combine themes from react-navigation, react-native-paper, and custom theme overrides.
 * 
 * @see https://callstack.github.io/react-native-paper/docs/guides/theming
 * @see https://callstack.github.io/react-native-paper/docs/guides/theming-with-react-navigation
 */

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});



const CombinedDefaultTheme = merge(MD3LightTheme, LightTheme);
const CombinedDarkTheme = merge(MD3DarkTheme, DarkTheme);


// Custom light and dark themes
const myLightTheme = {
  "colors": {
    "primary": "rgb(26 185 143)",
    "onPrimary": "rgb(255, 255, 255)",
    "primaryContainer": "rgb(98, 252, 202)",
    "onPrimaryContainer": "rgb(0, 33, 23)",
    "secondary": "rgb(76, 99, 89)",
    "onSecondary": "rgb(255, 255, 255)",
    "secondaryContainer": "rgb(206, 233, 219)",
    "onSecondaryContainer": "rgb(8, 32, 24)",
    "tertiary": "rgb(141, 79, 0)",
    "onTertiary": "rgb(255, 255, 255)",
    "tertiaryContainer": "rgb(255, 220, 192)",
    "onTertiaryContainer": "rgb(45, 22, 0)",
    "error": "rgb(186, 26, 26)",
    "onError": "rgb(255, 255, 255)",
    "errorContainer": "rgb(255, 218, 214)",
    "onErrorContainer": "rgb(65, 0, 2)",
    "background": "rgb(251, 253, 249)",
    "onBackground": "rgb(25, 28, 26)",
    "surface": "rgb(251, 253, 249)",
    "onSurface": "rgb(25, 28, 26)",
    "surfaceVariant": "rgb(219, 229, 222)",
    "onSurfaceVariant": "rgb(64, 73, 68)",
    "outline": "rgb(112, 121, 116)",
    "outlineVariant": "rgb(191, 201, 195)",
    "shadow": "rgb(0, 0, 0)",
    "scrim": "rgb(0, 0, 0)",
    "inverseSurface": "rgb(46, 49, 47)",
    "inverseOnSurface": "rgb(239, 241, 238)",
    "inversePrimary": "rgb(61, 223, 175)",
    "elevation": {
      "level0": "transparent",
      "level1": "rgb(238, 246, 241)",
      "level2": "rgb(231, 241, 236)",
      "level3": "rgb(223, 237, 231)",
      "level4": "rgb(221, 236, 229)",
      "level5": "rgb(216, 233, 226)"
    },
    "surfaceDisabled": "rgba(25, 28, 26, 0.12)",
    "onSurfaceDisabled": "rgba(25, 28, 26, 0.38)",
    "backdrop": "rgba(41, 50, 46, 0.4)"
  }
}

const myDarkTheme = {
  "colors": {
    "primary": "rgb(61, 223, 175)",
    "onPrimary": "rgb(0, 56, 41)",
    "primaryContainer": "rgb(0, 81, 61)",
    "onPrimaryContainer": "rgb(98, 252, 202)",
    "secondary": "rgb(179, 204, 192)",
    "onSecondary": "rgb(30, 53, 44)",
    "secondaryContainer": "rgb(52, 76, 66)",
    "onSecondaryContainer": "rgb(206, 233, 219)",
    "tertiary": "rgb(233, 195, 72)",
    "onTertiary": "rgb(60, 47, 0)",
    "tertiaryContainer": "rgb(87, 69, 0)",
    "onTertiaryContainer": "rgb(255, 224, 136)",
    "error": "rgb(255, 180, 171)",
    "onError": "rgb(105, 0, 5)",
    "errorContainer": "rgb(147, 0, 10)",
    "onErrorContainer": "rgb(255, 180, 171)",
    "background": "rgb(25, 28, 26)",
    "onBackground": "rgb(225, 227, 224)",
    "surface": "rgb(25, 28, 26)",
    // "onSurface": "rgb(225, 227, 224)",
    "onSurface": "rgb(225, 227, 224)",
    "surfaceVariant": "rgb(64, 73, 68)",
    "onSurfaceVariant": "rgb(191, 201, 195)",
    "outline": "rgb(137, 147, 141)",
    "outlineVariant": "rgb(64, 73, 68)",
    "shadow": "rgb(0, 0, 0)",
    "scrim": "rgb(0, 0, 0)",
    "inverseSurface": "rgb(225, 227, 224)",
    "inverseOnSurface": "rgb(46, 49, 47)",
    "inversePrimary": "rgb(0, 108, 81)",
    "elevation": {
      "level0": "transparent",
      "level1": "rgb(27, 38, 33)",
      "level2": "rgb(28, 44, 38)",
      "level3": "rgb(29, 50, 42)",
      "level4": "rgb(29, 51, 44)",
      "level5": "rgb(30, 55, 47)"
    },
    "surfaceDisabled": "rgba(225, 227, 224, 0.12)",
    "onSurfaceDisabled": "rgba(225, 227, 224, 0.38)",
    "backdrop": "rgba(41, 50, 46, 0.4)"
  }
}

export const customLightTheme = {
  ...CombinedDefaultTheme,
  colors: {
    ...CombinedDefaultTheme.colors,
    ...myLightTheme.colors,
    //custom
    // ...colors,
    background: 'rgb(242, 242, 242)',
    card: 'rgb(255, 255, 255)',
    text: 'rgb(28, 28, 30)',
    border: 'rgb(216, 216, 216)',
    muted: 'rgb(142, 142, 147)',

    // calculated ripple colors based on primary, secondary, tertiary colors
    ripplePrimary: Color(myLightTheme.colors.primary).alpha(0.12).rgb().string(),
    rippleSecondary: Color(myLightTheme.colors.secondary).alpha(0.12).rgb().string(),
    rippleTertiary: Color(myLightTheme.colors.tertiary).alpha(0.12).rgb().string(),
  },
};

export const customDarkTheme = {
  ...CombinedDarkTheme,
  colors: {
    ...CombinedDarkTheme.colors,
    ...myDarkTheme.colors,
    //custom
    // ...colors,
    background: 'rgb(1, 1, 1)',
    card: 'rgb(34, 34, 34)',
    text: 'rgb(229, 229, 231)',
    border: 'rgb(39, 39, 41)',
    muted: 'rgb(142, 142, 147)',

    // calculated ripple colors based on primary, secondary, tertiary colors
    ripplePrimary: Color(myDarkTheme.colors.primary).alpha(0.12).rgb().string(),
    rippleSecondary: Color(myDarkTheme.colors.secondary).alpha(0.12).rgb().string(),
    rippleTertiary: Color(myDarkTheme.colors.tertiary).alpha(0.12).rgb().string(),
  },
};

export type ThemeType = typeof customLightTheme | typeof customDarkTheme;