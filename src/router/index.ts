import { createRouter, createWebHistory } from "vue-router";
import Login from "@/views/Login.vue";
import PostList from "@/components/PostList.vue"; // ← 後で views に移動予定
import PostForm from "@/components/PostForm.vue";
import PostEdit from "@/components/PostEdit.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: () => {
        /**
         * localStorage.getItemはWeb APIのメソッドで、localStorageから指定したキーの値を取得
         */
        const isLoggedIn = localStorage.getItem("token") !== null;
        return isLoggedIn ? "/posts" : "/login";
      },
    },
    { path: "/login", name: "login", component: Login },

    {
      path: "/posts",
      name: "posts",
      component: PostList,
      meta: { requiresAuth: true },
    },
    {
      path: "/posts/create",
      name: "posts-create",
      component: PostForm,
      meta: { requiresAuth: true },
    },
    {
      path: "/posts/:id/edit",
      name: "posts-edit",
      component: PostEdit,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem("token") !== null;

  if (to.meta.requiresAuth && !isLoggedIn) {
    return next("/login");
  }

  next();
});

export { router };
