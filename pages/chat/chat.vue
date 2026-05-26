<template>
  <view class="chat-container">
    <!-- 左侧会话历史列表 -->
    <view class="sidebar">
      <view class="sidebar-header">
        <text class="new-chat-btn" @click="createNewSession">+ 新对话</text>
      </view>
      <scroll-view class="session-list" scroll-y>
        <view 
          v-for="session in sessions" 
          :key="session.session_id"
          class="session-item"
          :class="{ active: currentSessionId === session.session_id }"
          @click="switchSession(session.session_id)"
        >
          <text class="session-name">{{ formatSessionName(session) }}</text>
          <text class="delete-btn" @click.stop="deleteSession(session.session_id)">删除</text>
        </view>
        <view v-if="sessions.length === 0" class="empty-session">暂无会话，点击上方按钮创建</view>
      </scroll-view>
    </view>

    <!-- 右侧聊天区域 -->
    <view class="chat-main">
      <!-- 消息列表区域 -->
      <scroll-view 
        class="message-list" 
        scroll-y 
        :scroll-top="scrollTop"
        :scroll-with-animation="true"
        scroll-anchoring
        :enable-back-to-top="true"
      >
        <view 
          v-for="message in currentMessages" 
          :key="message.message_id || message.timestamp"
          class="message-item"
          :class="message.role === 'user' ? 'user' : 'assistant'"
        >
          <view class="message-bubble">
            <text class="message-content">{{ message.content }}</text>
          </view>
          <text class="message-time">{{ formatTime(message.timestamp) }}</text>
        </view>
        <view v-if="isLoading" class="message-item assistant">
          <view class="message-bubble loading-bubble">
            <text class="loading-text">AI正在思考...</text>
          </view>
        </view>
        <view v-if="currentMessages.length === 0 && !isLoading" class="empty-chat">
          <text>开始你的第一次对话吧~</text>
        </view>
      </scroll-view>

      <!-- 底部输入区域 -->
      <view class="input-area">
        <textarea 
          class="message-input" 
          v-model="inputText" 
          placeholder="输入消息..."
          :disabled="isLoading"
          auto-height
          maxlength="5000"
          confirm-type="send"
          @confirm="sendMessage"
        />
        <button 
          class="send-btn" 
          @click="sendMessage" 
          :disabled="!inputText.trim() || isLoading"
        >发送</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

// 设置 API 基础 URL（根据实际环境修改）
const API_BASE_URL = 'http://localhost:8000'; // FastAPI 服务地址

// ---------- 类型定义（与后端接口匹配）----------
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;  // ISO 格式时间字符串
  message_id?: string | null;
}

interface SessionInfo {
  session_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface SessionListResponse {
  sessions: SessionInfo[];
  total: number;
  page: number;
  page_size: number;
}

interface HistoryResponse {
  session_id: string;
  messages: Message[];
  total_count: number;
}

interface ChatRequest {
  message: string;
  session_id?: string | null;
  stream?: boolean;
}

interface ChatResponse {
  response: string;
  session_id: string;
  message_id: string | null;
  timestamp: string;
}

// ---------- 响应式数据 ----------
const sessions = ref<SessionInfo[]>([]);
const currentSessionId = ref<string>('');
const currentMessages = ref<Message[]>([]);
const inputText = ref('');
const isLoading = ref(false);
const scrollTop = ref(0);
const totalSessions = ref(0);
const currentPage = ref(1);
const isLoadingSessions = ref(false);

// ---------- 辅助函数 ----------
// 格式化时间显示
const formatTime = (timestamp?: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 格式化会话名称（使用创建时间或更新时间的简短表示）
const formatSessionName = (session: SessionInfo) => {
  if (session.message_count === 0) {
    return '空对话';
  }
  const date = new Date(session.updated_at);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hour}:${minute}`;
};

// 滚动到底部
const scrollToBottom = () => {
  setTimeout(() => {
    scrollTop.value = Date.now();
  }, 100);
};

// ---------- API 调用函数 ----------
// 获取会话列表
const fetchSessions = async (page: number = 1, pageSize: number = 20) => {
  if (isLoadingSessions.value) return;
  isLoadingSessions.value = true;
  
  try {
    const response = await uni.request({
      url: `${API_BASE_URL}/api/chat/sessions`,
      method: 'GET',
      data: {
        page,
        page_size: pageSize
      },
      header: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = response.data as unknown as SessionListResponse;
    if (response.statusCode === 200 && result.sessions) {
      sessions.value = result.sessions;
      totalSessions.value = result.total;
      currentPage.value = result.page;
    } else {
      console.error('获取会话列表失败:', result);
    }
  } catch (error) {
    console.error('获取会话列表异常:', error);
    uni.showToast({ title: '获取会话列表失败', icon: 'none' });
  } finally {
    isLoadingSessions.value = false;
  }
};

// 获取单个会话的历史消息
const fetchHistory = async (sessionId: string, limit: number = 100, offset: number = 0) => {
  if (!sessionId) return;
  
  try {
    const response = await uni.request({
      url: `${API_BASE_URL}/api/chat/history/${sessionId}`,
      method: 'GET',
      data: { limit, offset },
      header: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = response.data as unknown as HistoryResponse;
    if (response.statusCode === 200 && result.messages) {
      currentMessages.value = result.messages;
      scrollToBottom();
    } else {
      console.error('获取历史消息失败:', result);
      currentMessages.value = [];
    }
  } catch (error) {
    console.error('获取历史消息异常:', error);
    uni.showToast({ title: '获取历史消息失败', icon: 'none' });
    currentMessages.value = [];
  }
};

// 创建新会话（后端在首次发送消息时会自动创建，这里只切换状态）
const createNewSession = () => {
  // 设置一个临时空会话ID，发送消息时后端会自动创建会话
  currentSessionId.value = '';
  currentMessages.value = [];
  // 刷新会话列表
  fetchSessions(1);
  scrollToBottom();
};

// 切换会话
const switchSession = async (sessionId: string) => {
  if (isLoading.value) {
    uni.showToast({ title: '请等待回复完成', icon: 'none' });
    return;
  }
  
  currentSessionId.value = sessionId;
  await fetchHistory(sessionId);
};

// 删除会话
const deleteSession = async (sessionId: string) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这个会话吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const response = await uni.request({
            url: `${API_BASE_URL}/api/chat/session/${sessionId}`,
            method: 'DELETE',
            header: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.statusCode === 200) {
            uni.showToast({ title: '删除成功', icon: 'success' });
            // 刷新会话列表
            await fetchSessions(1);
            
            // 如果删除的是当前会话，清空当前显示
            if (currentSessionId.value === sessionId) {
              if (sessions.value.length > 0) {
                await switchSession(sessions.value[0].session_id);
              } else {
                currentSessionId.value = '';
                currentMessages.value = [];
              }
            }
          } else {
            uni.showToast({ title: '删除失败', icon: 'none' });
          }
        } catch (error) {
          console.error('删除会话异常:', error);
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

// 发送消息
const sendMessage = async () => {
  const content = inputText.value.trim();
  if (!content || isLoading.value) return;
  
  // 构造请求体
  const requestBody: ChatRequest = {
    message: content,
    session_id: currentSessionId.value || null,  // 如果没有 session_id，后端会自动创建
    stream: false  // 不使用流式输出
  };
  
  // 先临时显示用户消息（乐观更新）
  const tempUserMessage: Message = {
    role: 'user',
    content: content,
    timestamp: new Date().toISOString(),
    message_id: `temp-${Date.now()}`
  };
  currentMessages.value.push(tempUserMessage);
  inputText.value = '';
  scrollToBottom();
  
  isLoading.value = true;
  
  try {
    const response = await uni.request({
      url: `${API_BASE_URL}/api/chat/send`,
      method: 'POST',
      data: requestBody,
      header: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = response.data as unknown as ChatResponse;
    
    if (response.statusCode === 200 && result.response) {
      // 添加 AI 回复消息
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
        timestamp: result.timestamp || new Date().toISOString(),
        message_id: result.message_id
      };
      currentMessages.value.push(assistantMessage);
      
      // 更新当前会话ID（如果是新创建的会话）
      if (!currentSessionId.value && result.session_id) {
        currentSessionId.value = result.session_id;
        // 刷新会话列表以显示新会话
        await fetchSessions(1);
      }
      
      scrollToBottom();
    } else {
      // 请求失败，移除临时用户消息
      currentMessages.value.pop();
      uni.showToast({ title: '发送消息失败', icon: 'none' });
    }
  } catch (error) {
    console.error('发送消息异常:', error);
    // 移除临时用户消息
    currentMessages.value.pop();
    uni.showToast({ title: '网络错误，请重试', icon: 'none' });
  } finally {
    isLoading.value = false;
  }
};

// ---------- 生命周期 ----------
onMounted(() => {
  fetchSessions(1);
});
</script>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: #f5f5f5;
}

// 左侧边栏样式
.sidebar {
  width: 260px;
  background-color: #2c3e50;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #1a2a36;
  
  .sidebar-header {
    padding: 20px 16px;
    border-bottom: 1px solid #1a2a36;
    
    .new-chat-btn {
      display: block;
      text-align: center;
      background-color: #3498db;
      color: white;
      padding: 10px 0;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s;
      
      &:active {
        background-color: #2980b9;
      }
    }
  }
  
  .session-list {
    flex: 1;
    overflow-y: auto;
    
    .session-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid #1a2a36;
      cursor: pointer;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: #34495e;
      }
      
      &.active {
        background-color: #1abc9c;
        
        .session-name {
          color: white;
        }
        
        .delete-btn {
          color: #f1c40f;
        }
      }
      
      .session-name {
        flex: 1;
        color: #ecf0f1;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 12px;
      }
      
      .delete-btn {
        color: #e74c3c;
        font-size: 12px;
        opacity: 0.7;
        
        &:active {
          opacity: 1;
        }
      }
    }
    
    .empty-session {
      text-align: center;
      color: #95a5a6;
      padding: 40px 20px;
      font-size: 14px;
    }
  }
}

// 右侧聊天区域样式
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  
  .message-list {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background-color: #f8f9fa;
    
    .message-item {
      display: flex;
      margin-bottom: 20px;
      align-items: flex-start;
      
      &.user {
        justify-content: flex-end;
        
        .message-bubble {
          background-color: #3498db;
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .message-time {
          margin-right: 12px;
          order: -1;
        }
      }
      
      &.assistant {
        justify-content: flex-start;
        
        .message-bubble {
          background-color: white;
          color: #2c3e50;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .message-time {
          margin-left: 12px;
        }
      }
      
      .message-bubble {
        max-width: 70%;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 15px;
        line-height: 1.5;
        word-wrap: break-word;
        white-space: pre-wrap;
        
        &.loading-bubble {
          background-color: #e0e0e0;
          color: #666;
        }
        
        .loading-text {
          display: inline-block;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      }
      
      .message-time {
        font-size: 11px;
        color: #999;
        margin-top: 8px;
      }
    }
    
    .empty-chat {
      text-align: center;
      color: #bbb;
      padding: 60px 20px;
      font-size: 16px;
    }
  }
  
  .input-area {
    padding: 16px 20px;
    background-color: white;
    border-top: 1px solid #e0e0e0;
    display: flex;
    align-items: flex-end;
    gap: 12px;
    
    .message-input {
      flex: 1;
      min-height: 40px;
      max-height: 120px;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 20px;
      font-size: 15px;
      line-height: 1.4;
      background-color: #f8f9fa;
      transition: border-color 0.2s;
      
      &:focus {
        border-color: #3498db;
        outline: none;
      }
    }
    
    .send-btn {
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 20px;
      padding: 8px 20px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s;
      
      &:active:not(:disabled) {
        background-color: #2980b9;
      }
      
      &:disabled {
        background-color: #bdc3c7;
        cursor: not-allowed;
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .sidebar {
    width: 200px;
  }
  
  .message-bubble {
    max-width: 85% !important;
  }
}
</style>