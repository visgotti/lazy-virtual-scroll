import { createRouter, createWebHistory } from 'vue-router';
import FullPage from '../app/FullPage.vue';
import FixedSize from '../app/FixedSize.vue';

const routes = [
  { 
    path: '/', 
    redirect: '/full-page' 
  },
  {
    path: '/full-page',
    name: 'FullPage',
    component: FullPage
  },
  {
    path: '/fixed-size',
    name: 'FixedSize',
    component: FixedSize
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
