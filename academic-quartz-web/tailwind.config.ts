import withMT from "@material-tailwind/react/utils/withMT";

export default withMT({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          '300': '#c2abff',
          '400': '#a57cff',
          '500': '#8b47ff',
          '600': '#8021ff',
          '700': '#7210f1',
          '800': '#620DD1', // Default purple-800 
          '900': '#4f0da5',
          '950': '#300471'
        },       
        pink: {
          '300': '#ff9cb8',
          '400': '#ff6593',
          '500': '#ff2f72',
          '600': '#f20c60',
          '700': '#E1035A', // Default pink-700
          '800': '#ac054c',
          '900': '#920947',
          '950': '#520022'
        },
        gray: {
          '50': '#F8F8F8',  // Grey for backgrounds
          '100': '#efefef', // Lighter grey for backgrounds
          '200': '#d1d1d1', // Grey for borders
          '300': '#b0b0b0', // Grey for disabled elements
          '600': '#888888', // Grey for tertiary text
          '700': '#4d4d4d', // Grey for secondary text
          '900': '#333333', // Grey for primary text
        },
        green: '#0eaf5c',
      },
      fontFamily: {
        space: ['SpaceAge', 'sans-serif'],
        nico: ['NicoMoji', 'sans-serif'],
      },
    },
  },
  plugins: [],
});

