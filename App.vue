<!-- src/App.vue -->
<script>
import { useUserStore } from '@/store/user'

export default {
  onLaunch: function() {
    console.log('App Launch')
    
    // 初始化用户状态
    const userStore = useUserStore()
    userStore.initUser()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style>
/* 全局样式 */
</style>