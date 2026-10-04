// module-test-dialog/module-test-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

interface LeaderboardItem {
  rank: number;
  _id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  submittedAt: string;
}

@Component({
  selector: 'app-module-test-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  template: `
    <div class="dialog-wrapper">
      <h2 mat-dialog-title class="dialog-title">
        {{ data.testTitle || 'Test' }} - Leaderboard
      </h2>
      
      <mat-dialog-content class="dialog-content">
        <!-- Summary Cards -->
        <div class="summary-row" *ngIf="data.leaderboard.length > 0">
          <div class="summary-card">
            <div class="summary-value">{{ data.totalParticipants || data.leaderboard.length }}</div>
            <div class="summary-label">Total</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">{{ getHighestScore() }}</div>
            <div class="summary-label">Highest</div>
          </div>
        </div>

        <!-- Leaderboard Table -->
        <div *ngIf="data.leaderboard.length > 0" class="table-responsive">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Score</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of data.leaderboard" 
                  [class.current-user]="isCurrentUser(item.email)">
                <td>
                  <span class="rank-badge" [class.top-three]="item.rank <= 3">
                    {{ item.rank }}
                  </span>
                </td>
                <td>
                  <div class="name-cell">
                    <span class="name">{{ item.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="score">
                    {{ item.score }}/{{ item.totalQuestions }}
                    <span class="percentage">({{ getScorePercentage(item.score, item.totalQuestions) }}%)</span>
                  </span>
                </td>
                <td>{{ formatTime(item.timeTaken) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="!data.leaderboard?.length" class="empty-state">
          <mat-icon class="empty-icon">emoji_events</mat-icon>
          <h3>No submissions yet</h3>
          <p>Be the first to take this test!</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="onClose()">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-wrapper {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .dialog-title {
      margin: 0;
      padding: 20px 20px 0;
      font-size: 1.3rem;
      font-weight: 500;
      color: #333;
      word-break: break-word;
    }

    .dialog-content {
      padding: 16px 20px !important;
      max-height: 70vh;
      overflow-y: auto;
    }

    /* Summary Cards */
    .summary-row {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .summary-card {
      flex: 1 1 100px;
      background: #f5f5f5;
      padding: 12px 8px;
      border-radius: 6px;
      text-align: center;
      min-width: 70px;
    }

    .summary-value {
      font-size: 1.3rem;
      font-weight: 600;
      color: #3f51b5;
      line-height: 1.2;
    }

    .summary-label {
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
    }

    /* Table */
    .table-responsive {
      overflow-x: auto;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }

    .leaderboard-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 400px;
    }

    .leaderboard-table th {
      background: #f5f5f5;
      color: #333;
      font-weight: 600;
      font-size: 0.85rem;
      padding: 12px 10px;
      text-align: left;
      white-space: nowrap;
    }

    .leaderboard-table td {
      padding: 12px 10px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 0.9rem;
    }

    .leaderboard-table tr:last-child td {
      border-bottom: none;
    }

    .leaderboard-table tbody tr:hover {
      background: #fafafa;
    }

    .current-user {
      background: #e8f0fe;
    }

    /* Rank */
    .rank-badge {
      display: inline-block;
      min-width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      border-radius: 4px;
      background: #f0f0f0;
      color: #666;
      font-weight: 500;
      font-size: 0.85rem;
      padding: 0 4px;
    }

    .rank-badge.top-three {
      background: #3f51b5;
      color: white;
    }

    /* Name */
    .name-cell {
      display: flex;
      flex-direction: column;
      max-width: 200px;
    }

    .name {
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Score */
    .score {
      font-weight: 500;
      color: #333;
      white-space: nowrap;
    }

    .percentage {
      font-size: 0.75rem;
      color: #666;
      margin-left: 4px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 30px 15px;
    }

    .empty-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #ccc;
      margin-bottom: 12px;
    }

    .empty-state h3 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 1.1rem;
    }

    .empty-state p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    /* Actions */
    .dialog-actions {
      padding: 12px 20px;
      border-top: 1px solid #e0e0e0;
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .dialog-title {
        padding: 16px 16px 0;
        font-size: 1.2rem;
      }

      .dialog-content {
        padding: 12px 16px !important;
      }

      .summary-row {
        gap: 8px;
      }

      .summary-card {
        padding: 10px 5px;
      }

      .summary-value {
        font-size: 1.1rem;
      }

      .summary-label {
        font-size: 0.7rem;
      }

      .leaderboard-table th,
      .leaderboard-table td {
        padding: 8px 6px;
        font-size: 0.8rem;
      }

      .rank-badge {
        min-width: 20px;
        height: 20px;
        line-height: 20px;
        font-size: 0.75rem;
      }

      .name {
        max-width: 100px;
      }

      .percentage {
        display: none;
      }

      .dialog-actions {
        padding: 8px 16px;
      }
    }

    /* Small phones */
    @media (max-width: 400px) {
      .summary-card {
        flex: 1 1 calc(33.33% - 6px);
      }

      .leaderboard-table {
        min-width: 300px;
      }

      .name {
        max-width: 100px;
      }

      .dialog-actions button {
        font-size: 0.85rem;
        padding: 0 12px;
      }
    }
  `]
})
export class ModuleTestDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ModuleTestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      testTitle?: string;
      leaderboard: LeaderboardItem[];
      totalParticipants: number;
      currentUserEmail?: string;
    }
  ) {}

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  getScorePercentage(score: number, total: number): number {
    return Math.round((score / total) * 100);
  }

  getHighestScore(): number {
    if (!this.data.leaderboard?.length) return 0;
    return Math.max(...this.data.leaderboard.map(item => item.score));
  }

  isCurrentUser(email: string): boolean {
    return this.data.currentUserEmail === email;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}