<template>
	<view class="user-management">
		<view class="page-header">
			<view class="header-left">
				<text class="header-kicker">USER DIRECTORY</text>
				<text class="page-title-sm">用户管理</text>
				<text class="header-sub">账号 · 身份 · 状态</text>
			</view>
			<button class="btn btn-primary btn-add" @click="handleAdd">添加用户</button>
		</view>

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
					<view class="table-cell id-cell" style="width: 60px;">{{ user.id }}</view>
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
					<view class="table-cell cell-sub" style="width: 150px;">{{ formatTime(user.createTime) }}</view>
					<view class="table-cell cell-sub" style="width: 150px;">{{ formatTime(user.updateTime) }}</view>
					<view class="table-cell" style="flex: 1;">
						<button class="btn btn-sm btn-warning" @click="handleEdit(user)">编辑</button>
						<button class="btn btn-sm btn-danger" @click="handleDelete(user.id)">删除</button>
						<button class="btn btn-sm btn-info" @click="handleChangePassword(user.id)">修改密码</button>
						<button v-if="user.status === 1" class="btn btn-sm btn-danger" @click="handleDisable(user.id)">禁用</button>
						<button v-if="user.status === 0" class="btn btn-sm btn-success" @click="handleEnable(user.id)">启用</button>
					</view>
				</view>
				<view class="table-empty" v-if="userList.length === 0">
					<text class="empty-text">暂无数据</text>
					<text class="empty-caption">NO RECORDS</text>
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

// 用户提交数据
interface UserData {
	username: string
	number: string
	type: number
	status: number
	id?: number
	password?: string
}

// 搜索表单
interface SearchForm {
	id: string
	username: string
	number: string
}

const searchForm = reactive<SearchForm>({
	id: '',
	username: '',
	number: ''
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
		const userData: UserData = {
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

<style scoped>
/* =========================================================
   用户管理 · 教育档案室
   ========================================================= */
.user-management {
	width: 100%;
	max-width: 1280px;
	margin: 0 auto;
	box-sizing: border-box;
	padding: 24px 28px 40px;
	display: flex;
	flex-direction: column;
	gap: 14px;
	background: transparent;
}

/* ========== 页面头部 ========== */
.page-header {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 18px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--line);
}

.header-left {
	display: flex;
	flex-direction: column;
	gap: 5px;
}

.header-kicker {
	font-size: 9px;
	letter-spacing: 0.28em;
	color: var(--accent);
}

.page-title-sm {
	font-family: var(--font-display);
	font-size: 24px;
	font-weight: 600;
	line-height: 1.2;
	letter-spacing: 0.03em;
	color: var(--ink);
}

.header-sub {
	font-size: 11px;
	letter-spacing: 0.12em;
	color: var(--muted);
}

/* ========== 查询区域 ========== */
.search-area {
	padding: 14px 16px;
	background: var(--surface);
	border: 1px solid var(--line);
	border-radius: var(--radius);
	box-shadow: var(--shadow-soft);
}

.search-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 14px;
}

.search-item {
	display: flex;
	align-items: center;
	gap: 6px;
}

.label {
	font-size: 11px;
	letter-spacing: 0.1em;
	color: var(--muted);
	white-space: nowrap;
}

.input {
	width: 150px;
	height: 36px;
	padding: 0 12px;
	box-sizing: border-box;
	font-size: 13px;
	color: var(--ink);
	background: var(--surface-raised);
	border: 1px solid var(--line);
	border-radius: 10px;
	outline: none;
	transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.input:focus {
	border-color: var(--accent);
	box-shadow: 0 0 0 3px rgba(180, 83, 42, 0.1);
}

.search-actions {
	display: flex;
	gap: 10px;
	margin-left: auto;
}

/* ========== 按钮 ========== */
.btn {
	height: 36px;
	padding: 0 16px;
	box-sizing: border-box;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 12.5px;
	letter-spacing: 0.04em;
	border: 1px solid transparent;
	border-radius: 10px;
	cursor: pointer;
	transition: all 0.18s ease;
}

.btn-add {
	height: 38px;
	padding: 0 20px;
}

.btn-sm {
	height: 28px;
	padding: 0 10px;
	font-size: 11.5px;
	border-radius: 8px;
	margin-right: 6px;
}

.btn-primary {
	background: var(--ink);
	color: #F8F3E8;
	border-color: var(--ink);
}
.btn-primary:hover { background: #24334F; }

.btn-default {
	background: transparent;
	color: var(--ink-2);
	border-color: var(--line-strong);
}
.btn-default:hover {
	color: var(--accent-ink);
	border-color: var(--accent);
	background: var(--accent-soft);
}

.btn-success {
	background: #E7EFE8;
	color: var(--success);
	border-color: rgba(63, 107, 82, 0.2);
}
.btn-success:hover { background: rgba(63, 107, 82, 0.2); border-color: var(--success); }

.btn-warning {
	background: transparent;
	color: var(--ink-2);
	border-color: var(--line);
}
.btn-warning:hover {
	color: var(--accent-ink);
	border-color: var(--accent);
	background: var(--accent-soft);
}

.btn-danger {
	background: #F5E4E0;
	color: var(--danger);
	border-color: rgba(163, 59, 46, 0.2);
}
.btn-danger:hover { background: rgba(163, 59, 46, 0.16); border-color: var(--danger); }

.btn-info {
	background: #E4EBF2;
	color: var(--info);
	border-color: rgba(53, 89, 127, 0.18);
}
.btn-info:hover { background: rgba(53, 89, 127, 0.18); border-color: var(--info); }

.btn:disabled {
	opacity: 0.35;
	cursor: not-allowed;
}

/* ========== 表格区域 ========== */
.table-area {
	background: var(--surface);
	border: 1px solid var(--line);
	border-radius: var(--radius);
	box-shadow: var(--shadow-soft);
	overflow: hidden;
}

.table-header {
	display: flex;
	align-items: center;
	background: var(--surface);
	border-bottom: 1px solid var(--line);
}

.table-row {
	display: flex;
	align-items: center;
	min-height: 48px;
	background: var(--surface-raised);
	border-bottom: 1px solid var(--line);
	font-size: 13px;
	color: var(--ink-2);
	transition: background 0.18s ease, box-shadow 0.18s ease;
}

.table-row:hover {
	background: #FFFCF5;
	box-shadow: inset 0 0 0 1px var(--line-strong);
}

.table-body .table-row:last-child { border-bottom: none; }

.table-row .table-cell:last-child {
	flex-wrap: wrap;
	gap: 4px 0;
}

.table-cell {
	display: flex;
	align-items: center;
	padding: 12px 16px;
	box-sizing: border-box;
	word-break: break-all;
}

.table-header .table-cell {
	padding: 12px 16px;
	font-size: 10.5px;
	font-weight: 500;
	letter-spacing: 0.12em;
	color: var(--muted);
}

.id-cell {
	font-family: var(--font-mono);
	font-size: 11.5px;
	color: var(--muted);
}

.cell-sub {
	font-family: var(--font-mono);
	font-size: 11px;
	letter-spacing: 0.02em;
	color: var(--muted);
	white-space: nowrap;
}

.status-badge {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 11px;
	letter-spacing: 0.06em;
	white-space: nowrap;
}

.status-badge::before {
	content: '';
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background: currentColor;
	opacity: 0.72;
}

.status-active { background: #E7EFE8; color: var(--success); }
.status-disabled { background: #F5E4E0; color: var(--danger); }

/* ========== 空状态 ========== */
.table-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	margin: 18px;
	padding: 42px 16px;
	border: 1px dashed var(--line-strong);
	border-radius: 12px;
}

.empty-text {
	font-size: 13px;
	letter-spacing: 0.04em;
	color: var(--ink-2);
}

.empty-caption {
	font-size: 9px;
	letter-spacing: 0.24em;
	color: var(--muted);
}

/* ========== 分页区域 ========== */
.pagination-area {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	padding: 14px 18px;
	background: var(--surface);
	border: 1px solid var(--line);
	border-radius: var(--radius);
	box-shadow: var(--shadow-soft);
}

.pagination-info {
	font-family: var(--font-display);
	font-size: 12.5px;
	letter-spacing: 0.04em;
	color: var(--muted);
	font-variant-numeric: tabular-nums;
}

.pagination-controls {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 10px;
}

.page-info {
	padding: 0 4px;
	font-family: var(--font-display);
	font-size: 13px;
	letter-spacing: 0.04em;
	color: var(--ink);
	font-variant-numeric: tabular-nums;
}

.page-size-selector {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 11.5px;
	letter-spacing: 0.04em;
	color: var(--muted);
}

.page-size-select {
	height: 30px;
	padding: 0 6px;
	box-sizing: border-box;
	font-size: 12px;
	color: var(--ink);
	background: var(--surface-raised);
	border: 1px solid var(--line);
	border-radius: 8px;
	outline: none;
	transition: border-color 0.18s ease;
}

.page-size-select:focus { border-color: var(--accent); }

/* ========== 弹窗 ========== */
.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 20px;
	background: rgba(23, 35, 59, 0.42);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	width: 460px;
	max-width: 100%;
	max-height: 82vh;
	overflow-y: auto;
	background: var(--surface);
	border: 1px solid var(--line-strong);
	border-radius: var(--radius-lg);
	box-shadow: 0 24px 60px -30px rgba(23, 35, 59, 0.6);
	animation: dialogIn 0.18s ease both;
}

@keyframes dialogIn {
	from { opacity: 0; transform: translateY(8px); }
	to { opacity: 1; transform: translateY(0); }
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 22px 24px 16px;
	border-bottom: 1px solid var(--line);
}

.modal-title {
	font-family: var(--font-display);
	font-size: 19px;
	font-weight: 600;
	letter-spacing: 0.03em;
	color: var(--ink);
}

.modal-close {
	font-size: 20px;
	line-height: 1;
	color: var(--muted);
	cursor: pointer;
	transition: color 0.16s ease;
}

.modal-close:hover { color: var(--accent-ink); }

.modal-body { padding: 20px 24px 6px; }

.modal-footer {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	padding: 14px 24px 20px;
	border-top: 1px solid var(--line);
}

.form-item {
	display: flex;
	align-items: center;
	margin-bottom: 16px;
}

.form-label {
	width: 72px;
	margin-right: 12px;
	flex-shrink: 0;
	font-size: 11px;
	letter-spacing: 0.1em;
	color: var(--muted);
}

.form-input {
	flex: 1;
	height: 38px;
	padding: 0 12px;
	box-sizing: border-box;
	font-size: 13px;
	color: var(--ink);
	background: var(--surface-raised);
	border: 1px solid var(--line);
	border-radius: 10px;
	outline: none;
	transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.form-input:focus {
	border-color: var(--accent);
	box-shadow: 0 0 0 3px rgba(180, 83, 42, 0.1);
}

.form-radio-group {
	display: flex;
	flex-wrap: wrap;
	gap: 8px 18px;
}

.radio-label {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12.5px;
	color: var(--ink-2);
	cursor: pointer;
}

.radio-label input {
	accent-color: var(--accent);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
	.user-management {
		padding: 16px 14px 32px;
		gap: 12px;
	}

	.page-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 14px;
		padding-bottom: 14px;
	}

	.page-title-sm { font-size: 20px; }

	.btn-add { width: 100%; }

	.search-row {
		flex-direction: column;
		align-items: stretch;
		gap: 10px;
	}

	.search-item { gap: 10px; }
	.label { width: 72px; }

	.input {
		width: auto;
		flex: 1;
	}

	.search-actions {
		width: 100%;
		margin-left: 0;
	}

	.search-actions .btn { flex: 1; }

	.table-area { overflow-x: auto; }

	.table-header,
	.table-row { min-width: 1100px; }

	.table-cell { padding: 12px 14px; }

	.pagination-area {
		flex-direction: column;
		align-items: stretch;
		padding: 12px;
	}

	.pagination-controls { justify-content: space-between; }

	.modal-content { width: 100%; }

	.form-item { align-items: flex-start; }

	.form-label {
		width: 64px;
		padding-top: 10px;
	}
}
</style>