/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-purple': '#6366f1', // Indigo 500
                'brand-bg': '#f3f4f6', // Gray 100
            }
        },
    },
    plugins: [],
}