<template>
	<view class="home-container">
		<!-- 功能区 -->
		<view class="function-area">
			<view class="function-grid">
				<view class="function-item" @click="navigateTo('/pages/admin/user/user')">
					<view class="icon-wrapper user-icon">
						<text class="icon-text">👥</text>
					</view>
					<text class="function-label">用户管理</text>
				</view>
				<view class="function-item" @click="navigateTo('/pages/chat/chat')">
					<view class="icon-wrapper chat-icon">
						<text class="icon-text">🤖</text>
					</view>
					<text class="function-label">AI对话</text>
				</view>
			</view>
		</view>

		<!-- 底部导航栏 -->
		<view class="bottom-tab">
			<view class="tab-item active">
				<text class="tab-icon">🏠</text>
				<text class="tab-label">首页</text>
			</view>
			<view class="tab-item" @click="handleMessageTap">
				<text class="tab-icon">💬</text>
				<text class="tab-label">消息</text>
			</view>
			<view class="tab-item" @click="handleProfileTap">
				<text class="tab-icon">👤</text>
				<text class="tab-label">个人</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	// 组合式编程，TS语法
	import { } from 'vue'

	// 跳转方法：跳转到指定页面
	const navigateTo = (url: string) => {
		uni.navigateTo({
			url: url
		});
	}

	// 消息导航点击（暂不跳转，仅做提示）
	const handleMessageTap = () => {
		// 消息页面尚未实现，无跳转路径
		console.log('消息页面尚未实现');
		uni.showToast({
			title: '消息页面开发中',
			icon: 'none'
		});
	}

	// 个人导航点击（暂不跳转，仅做提示）
	const handleProfileTap = () => {
		// 个人页面尚未实现，无跳转路径
		console.log('个人页面尚未实现');
		uni.showToast({
			title: '个人页面开发中',
			icon: 'none'
		});
	}
</script>

<style>
	/* 整体容器 */
	.home-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f8f9fc;
		position: relative;
	}

	/* 功能区 - 占据剩余空间，用于放置功能按钮 */
	.function-area {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 40rpx;
	}

	/* 功能网格 - 两列布局 */
	.function-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		width: 100%;
		max-width: 600rpx;
		gap: 40rpx;
	}

	/* 每个功能项 */
	.function-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 200rpx;
		height: 200rpx;
		background-color: #ffffff;
		border-radius: 24rpx;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
		transition: transform 0.2s ease;
		cursor: pointer;
	}

	.function-item:active {
		transform: scale(0.94);
	}

	/* 图标外层 - 圆形背景 */
	.icon-wrapper {
		width: 90rpx;
		height: 90rpx;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.user-icon {
		background-color: #eef3ff;
	}

	.chat-icon {
		background-color: #f0f7ff;
	}

	/* 图标文字（Emoji） */
	.icon-text {
		font-size: 48rpx;
		line-height: 1;
	}

	/* 功能标签 */
	.function-label {
		font-size: 28rpx;
		color: #2c3e50;
		font-weight: 500;
		letter-spacing: 1rpx;
	}

	/* 底部导航栏 - 固定三栏 */
	.bottom-tab {
		display: flex;
		justify-content: space-around;
		align-items: center;
		background-color: #ffffff;
		border-top: 2rpx solid #f0f2f5;
		height: 120rpx;
		padding-bottom: env(safe-area-inset-bottom);
		box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.02);
		flex-shrink: 0;
	}

	/* 每个tab项 */
	.tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		height: 100%;
		position: relative;
	}

	/* 首页激活态：颜色加深 */
	.tab-item.active .tab-icon {
		color: #2b6df6;
		font-weight: 600;
	}

	.tab-item.active .tab-label {
		color: #2b6df6;
		font-weight: 600;
	}

	/* 图标 */
	.tab-icon {
		font-size: 44rpx;
		color: #8e9aaf;
		transition: color 0.2s;
		line-height: 1.2;
	}

	/* 标签文字 */
	.tab-label {
		font-size: 22rpx;
		color: #8e9aaf;
		margin-top: 4rpx;
		transition: color 0.2s;
	}

	/* 非激活态点击效果（仅反馈） */
	.tab-item:not(.active):active {
		opacity: 0.6;
	}
</style>