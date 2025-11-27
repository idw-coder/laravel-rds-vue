import { createRouter, createWebHistory } from "vue-router";
import Login from "@/views/Login.vue";
import Register from "@/views/Register.vue";
import GoogleCallback from "@/views/GoogleCallback.vue";
import PostList from "@/views/PostList.vue";
import PostForm from "@/views/PostForm.vue";
import PostEdit from "@/views/PostEdit.vue";
import PostDetail from "@/views/PostDetail.vue";
import Profile from "@/views/Profile.vue";
import TypingGame from "@/views/TypingGame.vue";
import NotFound from "@/views/NotFound.vue";
import BookReviewList from "@/views/BookReviewList.vue";
import YouTuberList from "@/views/YouTuberList.vue";
import AdminUsers from "@/views/AdminUsers.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: () => {
        /**
         * localStorage.getItemはWeb APIのメソッドで、localStorageから指定したキーの値を取得
         */

        // Laravel Sanctum の認証トークンでログイン状態を判定
        // const isLoggedIn = localStorage.getItem("authToken") !== null;
        // return isLoggedIn ? "/posts" : "/login";
        return "/posts";
      },
    },
    { path: "/login", name: "login", component: Login },
    { 
      path: "/register",
      name: "register",
      component: Register,
    },
    { 
      path: "/auth/google/callback", 
      name: "google-callback", 
      component: GoogleCallback 
    },

    {
      path: "/posts",
      name: "posts",
      component: PostList,
      // meta: { requiresAuth: true },
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
      // meta: { requiresAuth: true },
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
    {
      path: "/typing-game",
      name: "typing-game",
      component: TypingGame,
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: NotFound,
    },
    {
      path: "/book-reviews",
      name: "book-reviews",
      component: BookReviewList,
    },
    {
      path: "/youtuber-list",
      name: "youtuber-list",
      component: YouTuberList,
    },
    {
      path: "/admin/users",
      name: "admin-users",
      component: AdminUsers,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
});

router.beforeEach((to, from, next) => {
  // Laravel Sanctum の認証トークンでログイン状態を判定
  const isLoggedIn = localStorage.getItem("authToken") !== null;

  if (to.meta.requiresAuth && !isLoggedIn) {
    return next("/login");
  }

  // 管理者権限チェック
  if (to.meta.requiresAdmin) {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const roles = user.roles || [];
        const isAdmin = roles.some((role: any) => 
          role === "admin" || role.name === "admin"
        );
        if (!isAdmin) {
          return next("/");
        }
      } else {
        return next("/");
      }
    } catch {
      return next("/");
    }
  }
  
  next();
});

export { router };
