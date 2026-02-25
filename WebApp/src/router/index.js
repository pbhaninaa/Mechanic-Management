import { createRouter, createWebHistory } from "vue-router";
import { ref } from "vue";
import { getSafeJson } from "@/utils/storage";

import Login from "../views/Usermanagement/Login.vue";
import SignUp from "../views/Usermanagement/SignUp.vue";
import CreateProfile from "../views/Usermanagement/CreateProfile.vue";
import Profile from "../views/Usermanagement/Profile.vue";
import Dashboard from "../views/Dashboards/Dashboard.vue";
import RequestHistory from "../views/Client/RequestHistory.vue";
import Payments from "../views/shared/Payments.vue";
import JobRequests from "../views/Mechanic/MechanicRequests.vue";
import ManageJobs from "../views/Mechanic/ManageJobs.vue";
import Earnings from "../views/shared/Earnings.vue";
import UserManagement from "../views/Usermanagement/UserManagement.vue";
import { USER_ROLES } from "@/utils/constants";
import CarWashBookingsTable from "@/views/Carwash/CarWashBookingsTable.vue";
import ManageWashes from "@/views/Carwash/ManageWashes.vue";
import BookCarWash from "@/views/Carwash/BookCarWash.vue";
import RequestMechanic from "../views/Mechanic/RequestMechanic.vue";
import MyWashes from "@/views/Carwash/MyWashes.vue";
import Mapview from "@/views/shared/Mapview.vue";
import HelpPage from "@/views/Client/HelpPage.vue";
import PaymentScreen from "@/views/shared/PaymentScreen.vue";

const routes = [
  { path: "/", redirect: "/login" },

  { path: "/login", name: "Login", component: Login, meta: { requiresGuest: true } },
  { path: "/signup", name: "SignUp", component: SignUp, meta: { requiresGuest: true } },
  { path: "/create-profile", name: "CreateProfile", component: CreateProfile, props: true, meta: { requiresAuth: true } },
  { path: "/profile", name: "Profile", component: Profile, meta: { requiresAuth: true } },
  { path: "/dashboard", name: "Dashboard", component: Dashboard, meta: { requiresAuth: true } },
  { path: "/request", name: "RequestMechanic", component: RequestMechanic, meta: { requiresAuth: true } },
  { path: "/history", name: "RequestHistory", component: RequestHistory, meta: { requiresAuth: true } },
  { path: "/payments", name: "Payments", component: Payments, meta: { requiresAuth: true } },
  { path: "/jobs", name: "JobRequests", component: JobRequests, meta: { requiresAuth: true } },
  { path: "/manage-jobs", name: "ManageJobs", component: ManageJobs, meta: { requiresAuth: true } },
  { path: "/earnings", name: "Earnings", component: Earnings, meta: { requiresAuth: true } },
  { path: "/users", name: "UserManagement", component: UserManagement, meta: { requiresAuth: true } },
  {path: "/car-wash-bookings", name: "CarWashBookingsTable",component:CarWashBookingsTable,  meta: { requiresAuth: true } },
  {path:"/manage-washes", name:"ManageWashes", component:ManageWashes, meta:{requiresAuth:true}},
  {path: "/book-wash", name: "BookCarWash", component: BookCarWash, meta: { requiresAuth: true } },
  {path:"/my-washes",name:"MyWashes",component:MyWashes,meta:{requiresAuth:true}},
  {path:"/map-view",name:"Mapview",component:Mapview,meta:{requiresAuth:true}},
  {path:"/help-page",name:"HelpPage",component:HelpPage,meta:{requiresAuth:true}},
  {path:"/payment-screen",name:"PaymentScreen",component:PaymentScreen,meta:{requiresAuth:true}}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem("token");
  const userProfile = localStorage.getItem("userProfile");

  // Check authentication first
  if (to.meta.requiresAuth && !token) {
    next({ name: "Login" });
    return;
  }
  
  if (to.meta.requiresGuest && token) {
    // If user has a profile, go to Dashboard, otherwise go to CreateProfile
    if (userProfile) {
      next({ name: "Dashboard" });
    } else {
      next({ name: "CreateProfile" });
    }
    return;
  }

  // If user is authenticated and not going to login/signup, check profile
  if (token && !to.meta.requiresGuest && to.name !== 'CreateProfile') {
    const profile = getSafeJson('userProfile', null);

    if (!profile) {
      next({ name: "CreateProfile" });
      return;
    }

    const requiredFields = ['firstName', 'lastName', 'email', 'roles'];
    const hasCompleteProfile = requiredFields.every(field => {
      const value = profile[field];
      return value !== null && value !== undefined && value !== '' &&
             (Array.isArray(value) ? value.length > 0 : true);
    });

    if (!hasCompleteProfile) {
      next({ name: "CreateProfile" });
      return;
    }
  }

  next();
});

const userRole = ref(localStorage.getItem("role") || USER_ROLES.CLIENT);

export default router;
export { userRole };
