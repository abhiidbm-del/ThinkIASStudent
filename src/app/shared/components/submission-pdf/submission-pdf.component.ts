import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { environment } from '../../../../environment/environment';
@Component({standalone:true, imports:[CommonModule,MatDialogModule], template:`
  <h2 mat-dialog-title>{{filename}}</h2><mat-dialog-content>
  <p *ngIf="loading" role="status">Opening submitted PDF...</p>
  <p *ngIf="error" role="alert">{{error}} <button (click)="load()">Retry</button></p>
  <iframe *ngIf="safeUrl" [src]="safeUrl" title="Student submitted answer PDF" style="width:100%;height:65vh;border:0"></iframe>
  </mat-dialog-content><mat-dialog-actions align="end"><a *ngIf="url" [href]="url" target="_blank" rel="noopener">Open PDF in new tab</a><button mat-dialog-close>Close</button></mat-dialog-actions>
`,styles:[`button,a{padding:10px;margin:6px}mat-dialog-content{min-height:120px}`]})
export class SubmissionPdfComponent implements OnInit {
  private http=inject(HttpClient);private sanitizer=inject(DomSanitizer);private data=inject(MAT_DIALOG_DATA);
  filename='Submitted answer sheet';url='';safeUrl:SafeResourceUrl|null=null;loading=false;error='';
  ngOnInit(){this.load();}
  load(){this.loading=true;this.error='';this.safeUrl=null;this.url='';
    this.http.get<any>(environment.apiUrl+'/live-tests/submissions/'+encodeURIComponent(this.data.submissionId)+'/file').subscribe({
      next:r=>{this.loading=false;if(!r.url?.startsWith('https://')){this.error='PDF link is unavailable.';return;}this.filename=r.filename||this.filename;this.url=r.url;this.safeUrl=this.sanitizer.bypassSecurityTrustResourceUrl(r.url);},
      error:e=>{this.loading=false;this.error=e.error?.message||'Unable to open the PDF.';}
    });
  }
}
