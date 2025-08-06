// Announcement Service - Manages announcements across the application
class AnnouncementService {
  constructor() {
    this.storageKey = 'freshnest_announcements';
    this.listeners = [];
  }

  // Get all announcements
  getAnnouncements() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading announcements:', error);
      return [];
    }
  }

  // Get active announcements for a specific audience
  getActiveAnnouncements(targetAudience = 'all') {
    const announcements = this.getAnnouncements();
    const now = new Date();
    
    return announcements.filter(announcement => {
      // Check if announcement is active
      if (!announcement.isActive) return false;
      
      // Check if announcement has expired
      if (announcement.expiresAt && new Date(announcement.expiresAt) < now) {
        return false;
      }
      
      // Check target audience
      if (announcement.targetAudience === 'all' || announcement.targetAudience === targetAudience) {
        return true;
      }
      
      return false;
    });
  }

  // Save announcements
  saveAnnouncements(announcements) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(announcements));
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error saving announcements:', error);
      return false;
    }
  }

  // Add a new announcement
  addAnnouncement(announcement) {
    const announcements = this.getAnnouncements();
    const newAnnouncement = {
      ...announcement,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    announcements.unshift(newAnnouncement);
    return this.saveAnnouncements(announcements);
  }

  // Update an existing announcement
  updateAnnouncement(id, updates) {
    const announcements = this.getAnnouncements();
    const index = announcements.findIndex(a => a.id === id);
    
    if (index !== -1) {
      announcements[index] = {
        ...announcements[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return this.saveAnnouncements(announcements);
    }
    
    return false;
  }

  // Delete an announcement
  deleteAnnouncement(id) {
    const announcements = this.getAnnouncements();
    const filtered = announcements.filter(a => a.id !== id);
    return this.saveAnnouncements(filtered);
  }

  // Toggle announcement status
  toggleAnnouncementStatus(id) {
    const announcements = this.getAnnouncements();
    const announcement = announcements.find(a => a.id === id);
    
    if (announcement) {
      return this.updateAnnouncement(id, { isActive: !announcement.isActive });
    }
    
    return false;
  }

  // Subscribe to announcement changes
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of changes
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getAnnouncements());
      } catch (error) {
        console.error('Error notifying announcement listener:', error);
      }
    });
  }

  // Get announcements by priority
  getAnnouncementsByPriority(priority) {
    const announcements = this.getActiveAnnouncements();
    return announcements.filter(a => a.priority === priority);
  }

  // Get urgent announcements
  getUrgentAnnouncements(targetAudience = 'all') {
    return this.getAnnouncementsByPriority('urgent').filter(a => 
      a.targetAudience === 'all' || a.targetAudience === targetAudience
    );
  }

  // Mark announcement as read (for future implementation)
  markAsRead(announcementId, userId) {
    // This would typically be handled by the backend
    // For now, we'll store read status in localStorage
    const readKey = `freshnest_announcement_read_${userId}`;
    try {
      const readAnnouncements = JSON.parse(localStorage.getItem(readKey) || '[]');
      if (!readAnnouncements.includes(announcementId)) {
        readAnnouncements.push(announcementId);
        localStorage.setItem(readKey, JSON.stringify(readAnnouncements));
      }
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  }

  // Check if announcement is read
  isAnnouncementRead(announcementId, userId) {
    const readKey = `freshnest_announcement_read_${userId}`;
    try {
      const readAnnouncements = JSON.parse(localStorage.getItem(readKey) || '[]');
      return readAnnouncements.includes(announcementId);
    } catch (error) {
      console.error('Error checking announcement read status:', error);
      return false;
    }
  }

  // Get unread announcements count
  getUnreadCount(targetAudience = 'all', userId = null) {
    if (!userId) return 0;
    
    const activeAnnouncements = this.getActiveAnnouncements(targetAudience);
    return activeAnnouncements.filter(a => !this.isAnnouncementRead(a.id, userId)).length;
  }
}

// Create and export a singleton instance
const announcementService = new AnnouncementService();
export default announcementService;