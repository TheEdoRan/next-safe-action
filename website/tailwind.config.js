/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	darkMode: ["class", '[data-theme="dark"]'],
	corePlugins: {
		preflight: false,
	},
	theme: {
		extend: {
			screens: {
				xs: "490px",
			},
			animation: {
				"gradient-rotate": "gradient-rotate 6s linear infinite",
			},
			keyframes: {
				"gradient-rotate": {
					"0%, 100%": {
						backgroundPosition: "0% 0%",
					},
					"25%": {
						backgroundPosition: "100% 0%",
					},
					"50%": {
						backgroundPosition: "100% 100%",
					},
					"75%": {
						backgroundPosition: "0% 100%",
					},
				},
			},
			backgroundSize: {
				"300%": "300%",
			},
		},
	},
	plugins: [require("tailwindcss-bg-patterns")],
};
