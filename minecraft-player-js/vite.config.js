/**
* @type {import('vite').UserConfig}
*/

export default {
  base: '/minecraft-player-js/',
  build: {
    sourcemap: true
  },

  // Need to add this segment for auto updating using WSL
  server: {
    watch: {
        usePolling: true
    }
  }
}
