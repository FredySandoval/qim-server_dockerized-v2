import { createRouter, createWebHistory } from "vue-router";
import Home from '../components/Home.vue';
import NotFound from '../components/NotFound.vue';
import FilesMainPage from '../components/FilesMainPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Home,
    },
    {
      path: "/notfound",
      component: NotFound,
    },
    {
      path: '/:id',
      component: FilesMainPage,
    },
  ],
});

export default router;