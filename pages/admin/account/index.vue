<template>
  <view class="account-container">
    <!-- 顶部选项卡 -->
    <view class="tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.type"
        class="tab-item"
        :class="{ active: activeTab === tab.type }"
        @click="switchTab(tab.type)"
      >
        {{ tab.name }}
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <input 
        v-model="searchKeyword" 
        type="text" 
        placeholder="搜索姓名/学号/工号"
        class="search-input"
        @confirm="handleSearch"
      />
      <button class="search-btn" @click="handleSearch">搜索</button>
      <button class="add-btn" @click="showAddModal">添加用户</button>
    </view>

    <!-- 用户列表 -->
    <scroll-view class="user-list" scroll-y>
      <view v-if="filteredUsers.length === 0" class="empty-state">
        <text>暂无数据</text>
      </view>
      
      <view v-for="user in filteredUsers" :key="user.id" class="user-card">
        <view class="user-info">
          <text class="user-name">{{ user.name }}</text>
          <text class="user-detail">{{ getAccountField(user) }}：{{ user.account }}</text>
          <text class="user-detail" v-if="activeTab === 'student'">班级：{{ user.class }}</text>
          <text class="user-detail" v-if="activeTab === 'student'">专业：{{ user.major }}</text>
          <text class="user-detail" v-if="activeTab === 'teacher'">部门：{{ user.department }}</text>
        </view>
        <view class="user-actions">
          <button class="edit-btn" @click="showEditModal(user)">编辑</button>
          <button class="delete-btn" @click="deleteUser(user)">删除</button>
        </view>
      </view>
    </scroll-view>

    <!-- 添加/编辑弹窗 -->
    <view class="modal-mask" v-if="modalVisible" @click="closeModal">
      <view class="modal-container" @click.stop>
        <view class="modal-header">
          <text>{{ modalTitle }}</text>
          <text class="close-btn" @click="closeModal">×</text>
        </view>
        
        <scroll-view class="modal-body" scroll-y>
          <!-- 基础信息 -->
          <view class="form-item">
            <text class="label">姓名</text>
            <input v-model="formData.name" placeholder="请输入姓名" class="input" />
          </view>
          
          <view class="form-item">
            <text class="label">{{ accountLabel }}</text>
            <input v-model="formData.account" :placeholder="accountPlaceholder" class="input" />
          </view>
          
          <view class="form-item">
            <text class="label">登录密码</text>
            <input v-model="formData.password" placeholder="请输入密码（至少6位）" class="input" type="password" />
          </view>
          
          <!-- 学生专属字段 -->
          <template v-if="activeTab === 'student'">
            <view class="form-item">
              <text class="label">班级</text>
              <input v-model="formData.class" placeholder="请输入班级（如：计科001班）" class="input" />
            </view>
            <view class="form-item">
              <text class="label">专业</text>
              <input v-model="formData.major" placeholder="请输入专业（如：计算机科学）" class="input" />
            </view>
          </template>
          
          <!-- 教师专属字段 -->
          <template v-if="activeTab === 'teacher'">
            <view class="form-item">
              <text class="label">部门</text>
              <input v-model="formData.department" placeholder="请输入部门（如：计算机学院）" class="input" />
            </view>
          </template>
        </scroll-view>
        
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="saveUser">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'

// 用户类型定义
interface User {
  id: string
  name: string
  account: string
  password: string
  role: 'student' | 'teacher' | 'admin'
  class?: string
  major?: string
  department?: string
}

// 选项卡配置
const tabs = [
  { type: 'student' as const, name: '学生管理' },
  { type: 'teacher' as const, name: '教师管理' },
  { type: 'admin' as const, name: '管理员管理' }
]

// 响应式数据
const activeTab = ref<'student' | 'teacher' | 'admin'>('student')
const searchKeyword = ref('')
const modalVisible = ref(false)
const isEdit = ref(false)
const currentEditId = ref<string | null>(null)

// 用户数据存储
const users = ref<User[]>([])

// 表单数据
const formData = reactive({
  name: '',
  account: '',
  password: '',
  class: '',
  major: '',
  department: ''
})

// 计算属性
const accountLabel = computed(() => {
  switch (activeTab.value) {
    case 'student': return '学号'
    case 'teacher': return '工号'
    case 'admin': return '账号'
  }
})

const accountPlaceholder = computed(() => {
  switch (activeTab.value) {
    case 'student': return '请输入学号（将作为登录账号）'
    case 'teacher': return '请输入工号（将作为登录账号）'
    case 'admin': return '请输入账号'
  }
})

const modalTitle = computed(() => {
  return isEdit.value ? '编辑用户' : `添加${tabs.find(t => t.type === activeTab.value)?.name.slice(0, -2)}`
})

// 过滤用户
const filteredUsers = computed(() => {
  let filtered = users.value.filter(user => user.role === activeTab.value)
  
  if (searchKeyword.value) {
    filtered = filtered.filter(user => 
      user.name.includes(searchKeyword.value) || 
      user.account.includes(searchKeyword.value)
    )
  }
  
  return filtered
})

// 获取账号字段名
const getAccountField = (user: User) => {
  switch (user.role) {
    case 'student': return '学号'
    case 'teacher': return '工号'
    case 'admin': return '账号'
  }
}

// 初始化模拟数据
const initMockData = () => {
  const mockUsers: User[] = [
    // 学生数据
    {
      id: '1',
      name: '张三',
      account: '2024001',
      password: '123456',
      role: 'student',
      class: '计科001班',
      major: '计算机科学'
    },
    {
      id: '2',
      name: '李四',
      account: '2024002',
      password: '123456',
      role: 'student',
      class: '软工002班',
      major: '软件工程'
    },
    {
      id: '3',
      name: '王五',
      account: '2024003',
      password: '123456',
      role: 'student',
      class: '计科001班',
      major: '计算机科学'
    },
    // 教师数据
    {
      id: '4',
      name: '张教授',
      account: 'T2024001',
      password: '123456',
      role: 'teacher',
      department: '计算机学院'
    },
    {
      id: '5',
      name: '李教授',
      account: 'T2024002',
      password: '123456',
      role: 'teacher',
      department: '软件学院'
    },
    // 管理员数据
    {
      id: '6',
      name: '系统管理员',
      account: 'admin',
      password: '123456',
      role: 'admin'
    },
    {
      id: '7',
      name: '运维管理员',
      account: 'ops',
      password: '123456',
      role: 'admin'
    }
  ]
  
  users.value = mockUsers
}

// 切换选项卡
const switchTab = (tab: 'student' | 'teacher' | 'admin') => {
  activeTab.value = tab
  searchKeyword.value = ''
}

// 搜索
const handleSearch = () => {
  // 搜索逻辑已经通过计算属性实现，这里只需要触发即可
  console.log('搜索:', searchKeyword.value)
}

// 显示添加弹窗
const showAddModal = () => {
  isEdit.value = false
  currentEditId.value = null
  resetForm()
  modalVisible.value = true
}

// 显示编辑弹窗
const showEditModal = (user: User) => {
  isEdit.value = true
  currentEditId.value = user.id
  formData.name = user.name
  formData.account = user.account
  formData.password = ''
  formData.class = user.class || ''
  formData.major = user.major || ''
  formData.department = user.department || ''
  modalVisible.value = true
}

// 重置表单
const resetForm = () => {
  formData.name = ''
  formData.account = ''
  formData.password = ''
  formData.class = ''
  formData.major = ''
  formData.department = ''
}

// 关闭弹窗
const closeModal = () => {
  modalVisible.value = false
  resetForm()
}

// 保存用户
const saveUser = () => {
  // 表单验证
  if (!formData.name) {
    uni.showToast({ title: '请填写姓名', icon: 'none' })
    return
  }
  if (!formData.account) {
    uni.showToast({ title: `请填写${accountLabel.value}`, icon: 'none' })
    return
  }
  if (!isEdit.value && !formData.password) {
    uni.showToast({ title: '请设置登录密码', icon: 'none' })
    return
  }
  if (formData.password && formData.password.length < 6) {
    uni.showToast({ title: '密码长度至少6位', icon: 'none' })
    return
  }
  
  if (activeTab.value === 'student') {
    if (!formData.class) {
      uni.showToast({ title: '请填写班级', icon: 'none' })
      return
    }
    if (!formData.major) {
      uni.showToast({ title: '请填写专业', icon: 'none' })
      return
    }
  }
  
  if (activeTab.value === 'teacher') {
    if (!formData.department) {
      uni.showToast({ title: '请填写部门', icon: 'none' })
      return
    }
  }
  
  // 检查账号是否重复
  const existingUser = users.value.find(u => 
    u.account === formData.account && 
    u.role === activeTab.value &&
    u.id !== currentEditId.value
  )
  
  if (existingUser) {
    uni.showToast({ title: `${accountLabel.value}已存在`, icon: 'none' })
    return
  }
  
  if (isEdit.value && currentEditId.value) {
    // 编辑用户
    const index = users.value.findIndex(u => u.id === currentEditId.value)
    if (index !== -1) {
      users.value[index] = {
        ...users.value[index],
        name: formData.name,
        account: formData.account,
        password: formData.password || users.value[index].password,
        class: formData.class,
        major: formData.major,
        department: formData.department
      }
      uni.showToast({ title: '修改成功', icon: 'success' })
    }
  } else {
    // 添加用户
    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name,
      account: formData.account,
      password: formData.password,
      role: activeTab.value,
      class: formData.class,
      major: formData.major,
      department: formData.department
    }
    users.value.push(newUser)
    uni.showToast({ title: '添加成功', icon: 'success' })
  }
  
  closeModal()
}

// 删除用户
const deleteUser = (user: User) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除用户"${user.name}"吗？`,
    success: (res) => {
      if (res.confirm) {
        const index = users.value.findIndex(u => u.id === user.id)
        if (index !== -1) {
          users.value.splice(index, 1)
          uni.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    }
  })
}

// 页面加载时初始化数据
onMounted(() => {
  initMockData()
})
</script>

<style lang="scss" scoped>
.account-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

// 选项卡样式
.tabs {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 10rpx;
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 20rpx 0;
    font-size: 28rpx;
    color: #666;
    border-radius: 12rpx;
    transition: all 0.3s;
    
    &.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
  }
}

// 搜索栏
.search-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
  
  .search-input {
    flex: 1;
    height: 70rpx;
    background: #fff;
    border-radius: 35rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
  }
  
  .search-btn, .add-btn {
    height: 70rpx;
    line-height: 70rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
    border-radius: 35rpx;
  }
  
  .search-btn {
    background: #667eea;
    color: #fff;
  }
  
  .add-btn {
    background: #67c23a;
    color: #fff;
  }
}

// 用户列表
.user-list {
  height: calc(100vh - 250rpx);
  
  .empty-state {
    text-align: center;
    padding: 100rpx;
    color: #999;
  }
  
  .user-card {
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .user-info {
      flex: 1;
      
      .user-name {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 10rpx;
      }
      
      .user-detail {
        display: block;
        font-size: 26rpx;
        color: #999;
        margin-top: 8rpx;
      }
    }
    
    .user-actions {
      display: flex;
      gap: 20rpx;
      
      .edit-btn, .delete-btn {
        padding: 10rpx 25rpx;
        font-size: 24rpx;
        border-radius: 30rpx;
      }
      
      .edit-btn {
        background: #409eff;
        color: #fff;
      }
      
      .delete-btn {
        background: #f56c6c;
        color: #fff;
      }
    }
  }
}

// 弹窗样式
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .modal-container {
    width: 90%;
    max-height: 80vh;
    background: #fff;
    border-radius: 20rpx;
    display: flex;
    flex-direction: column;
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx;
      border-bottom: 1px solid #f0f0f0;
      
      text:first-child {
        font-size: 32rpx;
        font-weight: bold;
      }
      
      .close-btn {
        font-size: 40rpx;
        color: #999;
      }
    }
    
    .modal-body {
      padding: 30rpx;
      max-height: 60vh;
      
      .form-item {
        margin-bottom: 30rpx;
        
        .label {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 10rpx;
        }
        
        .input {
          width: 100%;
          height: 70rpx;
          border: 1px solid #ddd;
          border-radius: 10rpx;
          padding: 0 20rpx;
          font-size: 28rpx;
          box-sizing: border-box;
        }
      }
    }
    
    .modal-footer {
      display: flex;
      gap: 20rpx;
      padding: 30rpx;
      border-top: 1px solid #f0f0f0;
      
      button {
        flex: 1;
        height: 70rpx;
        line-height: 70rpx;
        font-size: 28rpx;
        border-radius: 10rpx;
      }
      
      .cancel-btn {
        background: #f5f5f5;
        color: #666;
      }
      
      .confirm-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
      }
    }
  }
}
</style>