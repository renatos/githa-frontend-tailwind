/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                dark: {
                    bg: '#151921',
                    sidebar: '#15171e',
                    card: '#1E222B',
                    border: '#2a2f3d',
                },
                brand: {
                    purple: '#6366f1',
                    green: '#10B981',
                    red: '#EF4444',
                    blue: '#3b82f6',
                },
                // Keep legacy aliases
                primary: '#6366f1',
                success: '#10B981',
                danger: '#EF4444',
                warning: '#f1c40f',
            }
        },
    },
    plugins: [],
}

