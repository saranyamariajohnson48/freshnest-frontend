import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class TaskService {
  async apiRequest(url, options = {}) {
    return await authService.apiRequest(url, options);
  }

  async createTask({ title, description = '', assignedTo, dueDate = null, priority = 'Medium' }) {
    const response = await this.apiRequest(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title, description, assignedTo, dueDate, priority })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create task');
    return data;
  }

  async listTasks(params = {}) {
    const query = new URLSearchParams(params);
    const response = await this.apiRequest(`${API_BASE_URL}/api/tasks?${query}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch tasks');
    return data;
  }

  async listAssignableStaff() {
    const response = await this.apiRequest(`${API_BASE_URL}/api/tasks/assignable/staff`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch staff');
    return data;
  }

  async updateStatus(id, status) {
    const response = await this.apiRequest(`${API_BASE_URL}/api/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update status');
    return data;
  }

  async deleteTask(id) {
    const response = await this.apiRequest(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete task');
    return data;
  }
}

const taskService = new TaskService();
export default taskService;


