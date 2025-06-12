<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo-container">
        <div class="logo">
          <span class="logo-text">Lazy<span class="highlight">Virtual</span>Scroll</span>
        </div>
        <span class="version">Vue Demo v1.0.0</span>
      </div>
      
      <nav class="nav-bar">
        <router-link to="/full-page" class="nav-link">Full Page Demo</router-link>
        <router-link to="/fixed-size" class="nav-link">Fixed Size Demo</router-link>
      </nav>
    </header>
    
    <main class="app-content">
      <ScrollPropControls v-model="scrollProps" />
      
      <keep-alive>
        <router-view :scrollProps="scrollProps" />
      </keep-alive>
    </main>
    
    <footer class="app-footer">
      <div class="footer-content">
        <p>
          &copy; 2025 Lazy Virtual Scroll. Released under MIT License.
          <a href="https://github.com/visgotti/lazy-virtual-scroll" target="_blank" class="footer-link">GitHub</a>
          <a href="https://www.npmjs.com/package/@lazy-virtual-scroll/vue" target="_blank" class="footer-link">NPM</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import ScrollPropControls, { type ScrollProps } from './ScrollPropControls.vue';

// Initialize with default values
const scrollProps = ref<ScrollProps>({
  itemSize: 65,
  itemBuffer: 3,
  totalItems: 300,
  scrollStart: 0,
  scrollThrottle: 0,
  scrollDebounce: 100,
  minItemSize: 0,
  autoDetectSizes: true,
  direction: 'column',
  sortDatasets: true
});
</script>

<style lang="scss">
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #1e293b;
  background-color: #f8fafc;
  height: 100vh;
  margin: 0;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(to right, #6366f1, #8b5cf6);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
}

.logo-text {
  .highlight {
    color: #c7d2fe;
  }
}

.version {
  font-size: 0.8rem;
  opacity: 0.8;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

.nav-bar {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.3s;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background-color: white;
    transition: width 0.3s ease;
  }
  
  &:hover, &.router-link-active {
    color: white;
    
    &::after {
      width: 100%;
    }
  }
}

.app-content {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
}

.app-footer {
  background-color: #1e293b;
  color: #94a3b8;
  padding: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-link {
  color: #e0e7ff;
  text-decoration: none;
  margin-left: 1rem;
  transition: color 0.2s;
  
  &:hover {
    color: white;
    text-decoration: underline;
  }
}
.nav-bar {
  padding: 20px;
  
  a {
    font-weight: bold;
    color: #2c3e50;
    text-decoration: none;
    margin: 0 10px;
    
    &.router-link-active {
      color: #42b983;
    }
  }
}

.nav-bar {
  padding: 20px;
  
  a {
    font-weight: bold;
    color: #2c3e50;
    text-decoration: none;
    margin: 0 10px;
    
    &.router-link-active {
      color: #42b983;
    }
  }
}
</style>
