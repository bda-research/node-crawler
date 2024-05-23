import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Home",
  description: "Node-crawler V2 Docs",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      {
        text: 'Get Started',
        link: '/get-started'
        // items: [
        //   { text: 'Markdown Examples', link: '/markdown-examples' },
        //   { text: 'Runtime API Examples', link: '/api-examples' }
        // ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
