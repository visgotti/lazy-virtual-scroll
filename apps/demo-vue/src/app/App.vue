<template>
  <div>
    <nav class="nav-bar">
      <router-link to="/full-page">Full Page</router-link> | 
      <router-link to="/fixed-size">Fixed Size</router-link>
    </nav>
    
    <ScrollPropControls v-model="scrollProps" />
    
    <keep-alive>
      <router-view :scrollProps="scrollProps" />
    </keep-alive>
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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
  
  > div {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
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
