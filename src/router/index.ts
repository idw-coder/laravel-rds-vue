import { createRouter, createWebHistory } from "vue-router";
import Login from "@/views/Login.vue";
import GoogleCallback from "@/views/GoogleCallback.vue";
import PostList from "@/views/PostList.vue";
import PostForm from "@/views/PostForm.vue";
import PostEdit from "@/views/PostEdit.vue";
import PostDetail from "@/views/PostDetail.vue";
import Profile from "@/views/Profile.vue";

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
      path: "/auth/google/callback", 
      name: "google-callback", 
      component: GoogleCallback 
    },

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
      path: "/posts/:id",
      name: "posts-detail",
      component: PostDetail,
      meta: { requiresAuth: true },
    },
    {
      path: "/posts/:id/edit",
      name: "posts-edit",
      component: PostEdit,
      meta: { requiresAuth: true },
    },
    {
      path: "/profile",
      name: "profile",
      component: Profile,
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
