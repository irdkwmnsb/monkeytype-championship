import { defineConfig } from 'vite'
import { splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    // server: {
    //     headers: {
    //         'Content-Security-Policy': `frame-ancestors *`,
    //     },
    // },

    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    r: ['react'],
                    fs: ['firebase/firestore'],
                    fa: ['firebase/auth'],
                }
            }
        }
    }
})
