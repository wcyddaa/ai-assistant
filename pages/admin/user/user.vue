<template>
	<view class="user-management">
		<!-- 查询区域 -->
		<view class="search-area">
			<view class="search-row">
				<view class="search-item">
					<text class="label">ID：</text>
					<input class="input" v-model="searchForm.id" placeholder="请输入用户ID" type="number" />
				</view>
				<view class="search-item">
					<text class="label">用户名：</text>
					<input class="input" v-model="searchForm.username" placeholder="请输入用户名" />
				</view>
				<view class="search-item">
					<text class="label">工号：</text>
					<input class="input" v-model="searchForm.number" placeholder="请输入工号" />
				</view>
				<view class="search-actions">
					<button class="btn btn-primary" @click="handleSearch">查询</button>
					<button class="btn btn-default" @click="handleReset">重置</button>
				</view>
			</view>
		</view>

		<!-- 操作按钮区域 -->
		<view class="action-area">
			<button class="btn btn-success" @click="handleAdd">添加用户</button>
		</view>

		<!-- 表格区域 -->
		<view class="table-area">
			<view class="table-header">
				<view class="table-cell" style="width: 60px;">ID</view>
				<view class="table-cell" style="width: 120px;">用户名</view>
				<view class="table-cell" style="width: 120px;">工号</view>
				<view class="table-cell" style="width: 80px;">状态</view>
				<view class="table-cell" style="width: 80px;">身份</view>
				<view class="table-cell" style="width: 150px;">创建时间</view>
				<view class="table-cell" style="width: 150px;">更新时间</view>
				<view class="table-cell" style="flex: 1;">操作</view>
			</view>
			<view class="table-body">
				<view class="table-row" v-for="user in userList" :key="user.id">
					<view class="table-cell" style="width: 60px;">{{ user.id }}</view>
					<view class="table-cell" style="width: 120px;">{{ user.username }}</view>
					<view class="table-cell" style="width: 120px;">{{ user.number }}</view>
					<view class="table-cell" style="width: 80px;">
						<text :class="['status-badge', user.status === 1 ? 'status-active' : 'status-disabled']">
							{{ user.status === 1 ? '正常' : '禁用' }}
						</text>
					</view>
					<view class="table-cell" style="width: 80px;">
						{{ user.type === 1 ? '管理员' : user.type === 2 ? '老师' : '学生' }}
					</view>
					<view class="table-cell" style="width: 150px;">{{ formatTime(user.createTime) }}</view>
					<view class="table-cell" style="width: 150px;">{{ formatTime(user.updateTime) }}</view>
					<view class="table-cell" style="flex: 1;">
						<button class="btn btn-sm btn-warning" @click="handleEdit(user)">编辑</button>
						<button class="btn btn-sm btn-danger" @click="handleDelete(user.id)">删除</button>
						<button class="btn btn-sm btn-info" @click="handleChangePassword(user.id)">修改密码</button>
						<button v-if="user.status === 1" class="btn btn-sm btn-danger" @click="handleDisable(user.id)">禁用</button>
						<button v-if="user.status === 0" class="btn btn-sm btn-success" @click="handleEnable(user.id)">启用</button>
					</view>
				</view>
				<view class="table-empty" v-if="userList.length === 0">
					<text>暂无数据</text>
				</view>
			</view>
		</view>

		<!-- 分页区域 -->
		<view class="pagination-area">
			<view class="pagination-info">
				<text>共 {{ total }} 条记录</text>
			</view>
			<view class="pagination-controls">
				<button class="btn btn-sm btn-default" @click="handlePageChange(currentPage - 1)" :disabled="currentPage <= 1">上一页</button>
				<text class="page-info">{{ currentPage }} / {{ totalPages }}</text>
				<button class="btn btn-sm btn-default" @click="handlePageChange(currentPage + 1)" :disabled="currentPage >= totalPages">下一页</button>
				<view class="page-size-selector">
					<text>每页</text>
					<select class="page-size-select" v-model="pageSize" @change="handlePageSizeChange">
						<option value="5">5</option>
						<option value="10">10</option>
						<option value="20">20</option>
						<option value="50">50</option>
					</select>
					<text>条</text>
				</view>
			</view>
		</view>

		<!-- 添加/编辑弹窗 -->
		<view class="modal-mask" v-if="showModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ modalTitle }}</text>
					<text class="modal-close" @click="closeModal">×</text>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">用户名：</text>
						<input class="form-input" v-model="formData.username" placeholder="请输入用户名" />
					</view>
					<view class="form-item" v-if="!isEdit">
						<text class="form-label">密码：</text>
						<input class="form-input" v-model="formData.password" placeholder="请输入密码" type="password" />
					</view>
					<view class="form-item">
						<text class="form-label">工号：</text>
						<input class="form-input" v-model="formData.number" placeholder="请输入工号" />
					</view>
					<view class="form-item">
						<text class="form-label">身份：</text>
						<view class="form-radio-group">
							<label class="radio-label">
								<input type="radio" value="1" v-model="formData.type" /> 管理员
							</label>
							<label class="radio-label">
								<input type="radio" value="2" v-model="formData.type" /> 老师
							</label>
							<label class="radio-label">
								<input type="radio" value="3" v-model="formData.type" /> 学生
							</label>
						</view>
					</view>
					<view class="form-item">
						<text class="form-label">状态：</text>
						<view class="form-radio-group">
							<label class="radio-label">
								<input type="radio" :value="1" v-model="formData.status" /> 正常
							</label>
							<label class="radio-label">
								<input type="radio" :value="0" v-model="formData.status" /> 禁用
							</label>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-default" @click="closeModal">取消</button>
					<button class="btn btn-primary" @click="handleSave">保存</button>
				</view>
			</view>
		</view>

		<!-- 修改密码弹窗 -->
		<view class="modal-mask" v-if="showPasswordModal" @click="closePasswordModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">修改密码</text>
					<text class="modal-close" @click="closePasswordModal">×</text>
				</view>
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">新密码：</text>
						<input class="form-input" v-model="newPassword" placeholder="请输入新密码" type="password" />
					</view>
					<view class="form-item">
						<text class="form-label">确认密码：</text>
						<input class="form-input" v-model="confirmPassword" placeholder="请确认新密码" type="password" />
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn btn-default" @click="closePasswordModal">取消</button>
					<button class="btn btn-primary" @click="handleSavePassword">确认修改</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

// 接口基础URL
const BASE_URL = 'http://localhost:8080/users'

// 用户数据接口
interface User {
	id: number
	username: string
	password?: string
	number: string
	status: number
	type: number
	createTime: string
	updateTime: string
	createrId: number
	updaterId: number
}

// 搜索表单
const searchForm = reactive({
	id: '' as string,
	username: '' as string,
	number: '' as string
})

// 分页参数
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const userList = ref<User[]>([])

// 弹窗控制
const showModal = ref(false)
const showPasswordModal = ref(false)
const isEdit = ref(false)
const modalTitle = ref('添加用户')
const editUserId = ref<number | null>(null)
const passwordUserId = ref<number | null>(null)
const newPassword = ref('')
const confirmPassword = ref('')

// 表单数据
const formData = reactive({
	username: '',
	password: '',
	number: '',
	type: 3,
	status: 1
})

// 计算总页数
const totalPages = computed(() => {
	return Math.ceil(total.value / pageSize.value) || 1
})

// 格式化时间
const formatTime = (time: string) => {
	if (!time) return '-'
	return time.replace('T', ' ').substring(0, 19)
}

// 查询用户列表
const fetchUserPage = async () => {
	try {
		const params = new URLSearchParams()
		params.append('pageNum', String(currentPage.value))
		params.append('pageSize', String(pageSize.value))
		
		const response = await fetch(`${BASE_URL}/page?${params}`)
		const result = await response.json()
		
		if (result.code === 200) {
			const pageData = result.data
			userList.value = pageData.records || []
			total.value = pageData.total || 0
		} else {
			uni.showToast({
				title: result.message || '查询失败',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('查询用户列表失败:', error)
		uni.showToast({
			title: '网络请求失败',
			icon: 'none'
		})
	}
}

// 根据ID查询用户
const fetchUserById = async (id: number) => {
	try {
		const response = await fetch(`${BASE_URL}/${id}`)
		const result = await response.json()
		return result
	} catch (error) {
		console.error('查询用户失败:', error)
		return null
	}
}

// 根据用户名查询用户
const searchByUsername = async () => {
	if (!searchForm.username.trim()) {
		uni.showToast({
			title: '请输入用户名',
			icon: 'none'
		})
		return
	}
	try {
		const response = await fetch(`${BASE_URL}/username/${encodeURIComponent(searchForm.username.trim())}`)
		const result = await response.json()
		
		if (result.code === 200) {
			userList.value = [result.data]
			total.value = 1
		} else {
			userList.value = []
			total.value = 0
			uni.showToast({
				title: result.message || '用户不存在',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('查询用户失败:', error)
		uni.showToast({
			title: '网络请求失败',
			icon: 'none'
		})
	}
}

// 根据工号查询用户
const searchByNumber = async () => {
	if (!searchForm.number.trim()) {
		uni.showToast({
			title: '请输入工号',
			icon: 'none'
		})
		return
	}
	try {
		const response = await fetch(`${BASE_URL}/number/${encodeURIComponent(searchForm.number.trim())}`)
		const result = await response.json()
		
		if (result.code === 200) {
			userList.value = [result.data]
			total.value = 1
		} else {
			userList.value = []
			total.value = 0
			uni.showToast({
				title: result.message || '用户不存在',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('查询用户失败:', error)
		uni.showToast({
			title: '网络请求失败',
			icon: 'none'
		})
	}
}

// 搜索处理
const handleSearch = () => {
	if (searchForm.id) {
		fetchUserById(Number(searchForm.id)).then(result => {
			if (result && result.code === 200) {
				userList.value = [result.data]
				total.value = 1
			} else {
				userList.value = []
				total.value = 0
				uni.showToast({
					title: result?.message || '用户不存在',
					icon: 'none'
				})
			}
		})
	} else if (searchForm.username) {
		searchByUsername()
	} else if (searchForm.number) {
		searchByNumber()
	} else {
		fetchUserPage()
	}
}

// 重置搜索
const handleReset = () => {
	searchForm.id = ''
	searchForm.username = ''
	searchForm.number = ''
	currentPage.value = 1
	fetchUserPage()
}

// 分页切换
const handlePageChange = (page: number) => {
	if (page < 1 || page > totalPages.value) return
	currentPage.value = page
	// 如果有搜索条件，保持搜索状态
	if (searchForm.id || searchForm.username || searchForm.number) {
		handleSearch()
	} else {
		fetchUserPage()
	}
}

// 每页条数变化
const handlePageSizeChange = () => {
	currentPage.value = 1
	fetchUserPage()
}

// 添加用户
const handleAdd = () => {
	isEdit.value = false
	modalTitle.value = '添加用户'
	formData.username = ''
	formData.password = ''
	formData.number = ''
	formData.type = 3
	formData.status = 1
	editUserId.value = null
	showModal.value = true
}

// 编辑用户
const handleEdit = async (user: User) => {
	isEdit.value = true
	modalTitle.value = '编辑用户'
	formData.username = user.username
	formData.password = ''
	formData.number = user.number
	formData.type = user.type
	formData.status = user.status
	editUserId.value = user.id
	showModal.value = true
}

// 保存用户
const handleSave = async () => {
	// 验证
	if (!formData.username.trim()) {
		uni.showToast({
			title: '请输入用户名',
			icon: 'none'
		})
		return
	}
	if (!isEdit.value && !formData.password.trim()) {
		uni.showToast({
			title: '请输入密码',
			icon: 'none'
		})
		return
	}
	if (!formData.number.trim()) {
		uni.showToast({
			title: '请输入工号',
			icon: 'none'
		})
		return
	}

	try {
		let url = BASE_URL
		let method = 'POST'
		const userData: any = {
			username: formData.username.trim(),
			number: formData.number.trim(),
			type: formData.type,
			status: formData.status
		}
		
		if (isEdit.value && editUserId.value) {
			url = BASE_URL
			method = 'PUT'
			userData.id = editUserId.value
		} else {
			userData.password = formData.password.trim()
		}

		const response = await fetch(url, {
			method: method,
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(userData)
		})
		const result = await response.json()

		if (result.code === 200) {
			uni.showToast({
				title: isEdit.value ? '更新成功' : '添加成功',
				icon: 'success'
			})
			closeModal()
			// 刷新列表
			if (searchForm.id || searchForm.username || searchForm.number) {
				handleSearch()
			} else {
				fetchUserPage()
			}
		} else {
			uni.showToast({
				title: result.message || '操作失败',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('保存用户失败:', error)
		uni.showToast({
			title: '网络请求失败',
			icon: 'none'
		})
	}
}

// 删除用户
const handleDelete = (id: number) => {
	uni.showModal({
		title: '确认删除',
		content: '确定要删除该用户吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					const response = await fetch(`${BASE_URL}/${id}`, {
						method: 'DELETE'
					})
					const result = await response.json()
					
					if (result.code === 200) {
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						})
						if (searchForm.id || searchForm.username || searchForm.number) {
							handleSearch()
						} else {
							fetchUserPage()
						}
					} else {
						uni.showToast({
							title: result.message || '删除失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('删除用户失败:', error)
					uni.showToast({
						title: '网络请求失败',
						icon: 'none'
					})
				}
			}
		}
	})
}

// 修改密码弹窗
const handleChangePassword = (id: number) => {
	passwordUserId.value = id
	newPassword.value = ''
	confirmPassword.value = ''
	showPasswordModal.value = true
}

// 保存密码
const handleSavePassword = async () => {
	if (!newPassword.value.trim() || newPassword.value.trim().length < 6) {
		uni.showToast({
			title: '密码至少6位',
			icon: 'none'
		})
		return
	}
	if (newPassword.value.trim() !== confirmPassword.value.trim()) {
		uni.showToast({
			title: '两次密码输入不一致',
			icon: 'none'
		})
		return
	}

	try {
		const params = new URLSearchParams()
		params.append('userId', String(passwordUserId.value))
		params.append('password', newPassword.value.trim())

		const response = await fetch(`${BASE_URL}/password?${params}`, {
			method: 'PUT'
		})
		const result = await response.json()

		if (result.code === 200) {
			uni.showToast({
				title: '密码修改成功',
				icon: 'success'
			})
			closePasswordModal()
		} else {
			uni.showToast({
				title: result.message || '修改失败',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('修改密码失败:', error)
		uni.showToast({
			title: '网络请求失败',
			icon: 'none'
		})
	}
}

// 禁用用户
const handleDisable = (id: number) => {
	uni.showModal({
		title: '确认禁用',
		content: '确定要禁用该用户吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					const response = await fetch(`${BASE_URL}/disable/${id}`, {
						method: 'PUT'
					})
					const result = await response.json()
					
					if (result.code === 200) {
						uni.showToast({
							title: '已禁用',
							icon: 'success'
						})
						if (searchForm.id || searchForm.username || searchForm.number) {
							handleSearch()
						} else {
							fetchUserPage()
						}
					} else {
						uni.showToast({
							title: result.message || '操作失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('禁用用户失败:', error)
					uni.showToast({
						title: '网络请求失败',
						icon: 'none'
					})
				}
			}
		}
	})
}

// 启用用户
const handleEnable = (id: number) => {
	uni.showModal({
		title: '确认启用',
		content: '确定要启用该用户吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					const response = await fetch(`${BASE_URL}/enable/${id}`, {
						method: 'PUT'
					})
					const result = await response.json()
					
					if (result.code === 200) {
						uni.showToast({
							title: '已启用',
							icon: 'success'
						})
						if (searchForm.id || searchForm.username || searchForm.number) {
							handleSearch()
						} else {
							fetchUserPage()
						}
					} else {
						uni.showToast({
							title: result.message || '操作失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('启用用户失败:', error)
					uni.showToast({
						title: '网络请求失败',
						icon: 'none'
					})
				}
			}
		}
	})
}

// 关闭弹窗
const closeModal = () => {
	showModal.value = false
}

// 关闭密码弹窗
const closePasswordModal = () => {
	showPasswordModal.value = false
}

// 页面加载
onMounted(() => {
	fetchUserPage()
})
</script>

<style>
.user-management {
	padding: 20px;
	background: #f5f7fa;
	min-height: 100vh;
}

/* 查询区域 */
.search-area {
	background: #ffffff;
	padding: 20px;
	border-radius: 8px;
	margin-bottom: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px;
}

.search-item {
	display: flex;
	align-items: center;
}

.label {
	font-size: 14px;
	color: #333;
	white-space: nowrap;
	margin-right: 4px;
}

.input {
	width: 140px;
	height: 32px;
	border: 1px solid #dcdfe6;
	border-radius: 4px;
	padding: 0 10px;
	font-size: 14px;
	outline: none;
}

.input:focus {
	border-color: #409eff;
}

.search-actions {
	display: flex;
	gap: 8px;
	margin-left: auto;
}

/* 操作按钮区域 */
.action-area {
	margin-bottom: 16px;
}

/* 按钮样式 */
.btn {
	padding: 6px 16px;
	border: none;
	border-radius: 4px;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.3s;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.btn-sm {
	padding: 3px 10px;
	font-size: 12px;
	margin-right: 4px;
}

.btn-primary {
	background: #409eff;
	color: #fff;
}
.btn-primary:hover {
	background: #66b1ff;
}

.btn-success {
	background: #67c23a;
	color: #fff;
}
.btn-success:hover {
	background: #85ce61;
}

.btn-warning {
	background: #e6a23c;
	color: #fff;
}
.btn-warning:hover {
	background: #ebb563;
}

.btn-danger {
	background: #f56c6c;
	color: #fff;
}
.btn-danger:hover {
	background: #f78989;
}

.btn-info {
	background: #909399;
	color: #fff;
}
.btn-info:hover {
	background: #a6a9ad;
}

.btn-default {
	background: #f5f7fa;
	color: #606266;
	border: 1px solid #dcdfe6;
}
.btn-default:hover {
	background: #ecf5ff;
	border-color: #c6e2ff;
	color: #409eff;
}

.btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

/* 表格区域 */
.table-area {
	background: #ffffff;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.table-header {
	display: flex;
	background: #f5f7fa;
	border-bottom: 1px solid #ebeef5;
	font-weight: 600;
	font-size: 14px;
	color: #333;
}

.table-row {
	display: flex;
	border-bottom: 1px solid #ebeef5;
	font-size: 13px;
	color: #606266;
	min-height: 44px;
	align-items: center;
}

.table-row:hover {
	background: #f5f7fa;
}

.table-cell {
	padding: 8px 10px;
	display: flex;
	align-items: center;
	word-break: break-all;
}

.status-badge {
	padding: 2px 10px;
	border-radius: 10px;
	font-size: 12px;
}

.status-active {
	background: #d4edda;
	color: #155724;
}

.status-disabled {
	background: #f8d7da;
	color: #721c24;
}

.table-empty {
	padding: 40px;
	text-align: center;
	color: #909399;
	font-size: 14px;
}

/* 分页区域 */
.pagination-area {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 20px;
	background: #ffffff;
	border-radius: 0 0 8px 8px;
	border-top: 1px solid #ebeef5;
	margin-bottom: 16px;
}

.pagination-info {
	font-size: 14px;
	color: #606266;
}

.pagination-controls {
	display: flex;
	align-items: center;
	gap: 12px;
}

.page-info {
	font-size: 14px;
	color: #606266;
}

.page-size-selector {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 14px;
	color: #606266;
}

.page-size-select {
	height: 28px;
	border: 1px solid #dcdfe6;
	border-radius: 4px;
	padding: 0 4px;
	font-size: 14px;
	outline: none;
}

/* 弹窗样式 */
.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	background: #ffffff;
	border-radius: 8px;
	width: 480px;
	max-height: 80vh;
	overflow-y: auto;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 20px;
	border-bottom: 1px solid #ebeef5;
}

.modal-title {
	font-size: 18px;
	font-weight: 600;
	color: #303133;
}

.modal-close {
	font-size: 24px;
	cursor: pointer;
	color: #909399;
	line-height: 1;
}
.modal-close:hover {
	color: #409eff;
}

.modal-body {
	padding: 20px;
}

.modal-footer {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	padding: 12px 20px;
	border-top: 1px solid #ebeef5;
}

.form-item {
	display: flex;
	align-items: center;
	margin-bottom: 16px;
}

.form-label {
	font-size: 14px;
	color: #606266;
	width: 70px;
	text-align: right;
	margin-right: 12px;
	flex-shrink: 0;
}

.form-input {
	flex: 1;
	height: 32px;
	border: 1px solid #dcdfe6;
	border-radius: 4px;
	padding: 0 10px;
	font-size: 14px;
	outline: none;
}
.form-input:focus {
	border-color: #409eff;
}

.form-radio-group {
	display: flex;
	gap: 16px;
}

.radio-label {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 14px;
	color: #606266;
	cursor: pointer;
}
</style>