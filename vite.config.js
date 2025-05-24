import { defineConfig } from 'vite'
import { readdirSync } from 'fs'
import { join, extname } from 'path'
import autoprefixer from 'autoprefixer'

const srcDir = join(__dirname, 'src')
const htmlFiles = readdirSync(srcDir).filter(file => extname(file) === '.html')
    .reduce((entries, file) => {
    const name = file.replace('.html', '')
    entries[name] = join(srcDir, file)
    return entries
  }, {})

export default defineConfig({
    base: '/quiz',
    root: 'src/',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        assetsDir: '',
        rollupOptions: {
            input: htmlFiles,
            output: {
                entryFileNames: 'js/[name].js',
                chunkFileNames: 'js/[name].js',
                assetFileNames: ({ names, originalFileNames }) => {
                    let assetName = names[0].toLowerCase(),
                        assetPath = originalFileNames[0]
                    if (/\.(gif|jpeg|jpg|png)$/.test(assetName ?? '')) {
                        return 'assets/images/[name][extname]'
                    }
                    if (/\.svg$/i.test(assetName ?? '')) {
                        if (/fonts/i.test(assetPath ?? '')) return 'assets/fonts/[name][extname]'
                        return 'assets/images/[name][extname]'
                    }
                    if (/\.(ttf|eot|woff|woff2)$/.test(assetName ?? '')) {
                        return 'assets/fonts/[name][extname]'
                    }
                    if (/\.css$/.test(assetName ?? '')) {
                        return 'assets/stylesheets/[name][extname]'
                    }
                    if (/\.js$/.test(assetName ?? '')) {
                        return 'assets/js/[name][extname]'
                    }
                    return 'assets/[name][extname]'
                },
            },
        },
    },
    css: {
        postcss: {
            plugins: [
                autoprefixer({
                    overrideBrowserslist: ['last 2 versions']
                }),
            ],
        },
    },
    plugins: [
        
    ],
})