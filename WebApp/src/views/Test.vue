<template>
  <TableComponent
    title="Users List"
    :headers="headers"
    :items="users"
    :loading="loading"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import TableComponent from "@/components/TableComponent.vue";
import apiService from "@/api/apiService";

const loading = ref(false);
const users = ref<any[]>([]);

const headers = [
  { title: "Username", value: "username" },
  { title: "Email", value: "email" },
  { title: "Full Name", value: "firstName",
    formatter: (item: any) =>
      `${item.firstName} ${item.lastName}`
  },
  { title: "Phone", value: "phoneNumber" },
];

const getUsers = async () => {
  loading.value = true;
  try {
    const res = await apiService.getAllUsers();
    users.value = res?.data ?? [];
  } finally {
    loading.value = false;
  }
};

onMounted(getUsers);
</script>
