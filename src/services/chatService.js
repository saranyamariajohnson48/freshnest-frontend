import authService from './authService';

// Keep consistent with other services
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ChatService {
  async apiRequest(url, options = {}) {
    return await authService.apiRequest(url, options);
  }

  async listConversations() {
    const resp = await this.apiRequest(`${API_BASE_URL}/api/chat/conversations`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to load conversations');
    return data;
  }

  // Utility: compute unread counts per conversation and total
  computeUnread(conversations, currentUserId) {
    let total = 0;
    const byConvo = {};
    for (const c of conversations || []) {
      const last = c.lastMessage;
      // Count as unread if last message exists, was not sent by me, and I haven't read it.
      if (last && String(last.sender) !== String(currentUserId)) {
        // If backend later tracks read receipts per convo, adapt here. For now, 1 unread if last from other.
        byConvo[c._id] = 1;
        total += 1;
      } else {
        byConvo[c._id] = 0;
      }
    }
    return { total, byConvo };
  }

  async startConversation(participantId) {
    const resp = await this.apiRequest(`${API_BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      body: JSON.stringify({ participantId })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to start conversation');
    return data;
  }

  async getMessages(conversationId, params = {}) {
    const qs = new URLSearchParams(params);
    const resp = await this.apiRequest(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages?${qs}`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to load messages');
    return data;
  }

  async sendMessage(conversationId, { text, attachments } = {}) {
    const resp = await this.apiRequest(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, attachments })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to send message');
    return data;
  }

  async markAsRead(conversationId) {
    const resp = await this.apiRequest(`${API_BASE_URL}/api/chat/conversations/${conversationId}/read`, { method: 'POST' });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to mark as read');
    return data;
  }
}

const chatService = new ChatService();
export default chatService;