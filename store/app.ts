// store/app.ts - 全局应用状态
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarVisible = ref(false)
  const currentPageTitle = ref('星枢平台')

  const isMobile = computed(() => {
    // #ifdef H5
    return window.innerWidth < 768
    // #endif
    // #ifndef H5
    return true
    // #endif
  })

  function toggleSidebar() {
    sidebarVisible.value = !sidebarVisible.value
  }

  function closeSidebar() {
    sidebarVisible.value = false
  }

  function setTitle(title: string) {
    currentPageTitle.value = title
    uni.setNavigationBarTitle({ title })
  }

  return { sidebarVisible, currentPageTitle, isMobile, toggleSidebar, closeSidebar, setTitle }
})