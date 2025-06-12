const defaultTheme = require("tailwindcss/defaultTheme");
const plugin = require('tailwindcss/plugin');


/** @type {import("tailwindcss/tailwind-config").TailwindConfig } */
module.exports = {
    darkMode: ["class"],
    content: [
    "index.html",
    "./src/**/*.{html,js,ts,jsx,tsx}"
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Inter',
                    ...defaultTheme.fontFamily.sans
                ]
  		},
  		screens: {
  			'tablet': '850px',
  			'desktop': '1090px'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [
    require('tailwindcss-children'),
    require('@tailwindcss/typography'),
    plugin(function({ addVariant }) {
      addVariant('not-hover', '&:not(:hover)');
      addVariant('not-active', '&:not(:active)');
      addVariant('not-focus', '&:not(:focus)');
      addVariant('not-focus-visible', '&:not(:focus-visible)');
      addVariant('not-disabled', '&:not([disabled])');
    }),
      require("tailwindcss-animate")
],
}
