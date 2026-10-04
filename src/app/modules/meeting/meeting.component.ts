import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Meeting, MeetingService } from '../../shared/services/meeting.service';

@Component({
  selector: 'app-meeting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting.component.html',
  styleUrls: ['./meeting.component.css']
})
export class MeetingComponent implements OnInit {
  upcomingMeetings: Meeting[] = [];
  completedMeetings: Meeting[] = [];
  loading = false;
  infoMessage = '';
  errorMessage = '';
  audience: 'pre' | 'mains' = 'pre';
  
  constructor(private meetingService: MeetingService, private route: ActivatedRoute) {}
  
  ngOnInit() {
    this.audience = this.route.snapshot.data['audience'] === 'mains' ? 'mains' : 'pre';
    this.loadMeetings();
  }
  
  loadMeetings() {
    this.loading = true;
    
    this.meetingService.getStudentMeetings(this.audience).subscribe({
      next: (response) => {
        this.upcomingMeetings = response.upcomingMeetings;
        this.completedMeetings = response.completedMeetings;
        this.loading = false;
        this.clearMessages();
      },
      error: (error) => {
        this.showError('Failed to load meetings', error);
      }
    });
  }
  
  // Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    
    // Format: 15-Jan-2025 14:30
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }
  
  // Format duration
  formatDuration(minutes: number): string {
    if (!minutes) return '-';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (mins === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }
  
  // Check if meeting is happening now
  isMeetingNow(meeting: Meeting): boolean {
    const now = new Date();
    const meetingStart = new Date(meeting.meetingDate);
    const meetingEnd = new Date(meetingStart.getTime() + (meeting.duration * 60000));
    
    return now >= meetingStart && now <= meetingEnd;
  }
  
  // Check if meeting is upcoming
  isMeetingUpcoming(meeting: Meeting): boolean {
    const now = new Date();
    const meetingStart = new Date(meeting.meetingDate);
    return now < meetingStart;
  }
  
  // Get relative time (optional)
  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays === 0) {
      // Today
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `today at ${hours}:${minutes}`;
    } else if (diffDays === 1) {
      // Tomorrow
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `tomorrow at ${hours}:${minutes}`;
    } else if (diffDays < 7) {
      // In X days
      return `in ${diffDays} days`;
    } else {
      return '';
    }
  }
  
  // Helper methods
  private showError(message: string, error: any) {
    this.loading = false;
    this.errorMessage = `${message}: ${error.error?.message || error.message || 'Unknown error'}`;
    console.error(message, error);
    
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }
  
  private clearMessages() {
    this.errorMessage = '';
    this.infoMessage = '';
  }
}