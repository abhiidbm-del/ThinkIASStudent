import {Component,OnInit,Input,inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {environment} from '../../../../environment/environment';
import {TranslatePipe} from '../../../shared/i18n/translate.pipe';

@Component({
	selector:'app-program-faqs',
	standalone:true,
	imports:[CommonModule,FormsModule,TranslatePipe],
	template:`
		<section class="faq-page">
			<div class="faq-heading">
				<span class="faq-kicker">{{ 'NEED TO KNOW' | t }}</span>
				<h1>{{'Program FAQs' | t}}</h1>
				<p>{{ 'Clear answers to help you choose the right program.' | t }}</p>
			</div>
			<label class="faq-filter" *ngIf="!programId">
				<span>{{ 'Choose a program' | t }}</span>
				<select [(ngModel)]="selected">
					<option value="">All programs</option>
					<option *ngFor="let p of programs" [value]="p._id">{{p.programName | t:p.programNameHindi}}</option>
				</select>
			</label>
			<div class="faq-state" *ngIf="loading"><span class="faq-spinner"></span>{{ 'Loading FAQs...' | t }}</div>
			<p class="faq-error" role="alert" *ngIf="error">{{error}}</p>
			<div class="faq-empty" *ngIf="!loading && !error && !visible.length">
				<i class="fas fa-comments"></i>
				<h2>{{ 'No FAQs published yet' | t }}</h2>
				<p>{{ 'Please check back soon for answers about this program.' | t }}</p>
			</div>
			<div class="faq-list" *ngIf="!loading && visible.length">
				<details *ngFor="let faq of visible; let i = index" [open]="i === 0">
					<summary><span class="faq-number">{{ (i + 1).toString().padStart(2, '0') }}</span><span>{{faq.question | t:faq.questionHindi}}</span><i class="fas fa-plus"></i></summary>
					<p>{{faq.answer | t:faq.answerHindi}}</p>
				</details>
			</div>
		</section>
	`,
	styles:[`
		:host{display:block;background:#f6f8fb;min-height:100vh}.faq-page{max-width:1240px;margin:0 auto;padding:24px 28px 72px}.faq-home-link{display:inline-flex;align-items:center;gap:9px;color:#17683f;text-decoration:none;font-size:13px;font-weight:700;padding:10px 14px;border:1px solid #cde8da;border-radius:999px;background:#f1f7f4;transition:transform .25s ease,box-shadow .25s ease,background-color .25s ease}.faq-home-link:hover{background:#e1f3e8;box-shadow:0 6px 14px rgba(23,104,63,.12);transform:translateX(-3px)}.faq-home-link i{font-size:11px}.faq-heading{position:relative;overflow:hidden;margin-top:24px;padding:46px 48px;border-radius:22px;background:linear-gradient(120deg,#102a43 0%,#1d5374 62%,#198754 100%);box-shadow:0 18px 40px rgba(16,42,67,.16)}.faq-heading>*{position:relative;z-index:1}.faq-heading h1{margin:10px 0 8px;color:#fff;font-size:clamp(32px,5vw,54px);letter-spacing:-.02em}.faq-heading p{margin:0;color:#d7e7ed;font-size:16px}.faq-kicker{color:#b5e5c7;font-size:11px;font-weight:800;letter-spacing:.14em}.faq-filter{display:flex;align-items:center;gap:14px;margin:28px 0;padding:18px 20px;color:#334155;font-size:13px;font-weight:700;border:1px solid #e0e8ee;border-radius:14px;background:#fff;box-shadow:0 6px 20px rgba(16,42,67,.05)}.faq-filter select{min-width:280px;padding:11px 38px 11px 13px;border:1px solid #d6e0e8;border-radius:9px;background:#fff;color:#102a43;font:inherit}.faq-state,.faq-empty{padding:38px;text-align:center;color:#64748b;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 8px 24px rgba(16,42,67,.05)}.faq-spinner{display:inline-block;width:18px;height:18px;margin-right:9px;border:3px solid #d8eee1;border-top-color:#198754;border-radius:50%;vertical-align:-4px;animation:faq-spin .8s linear infinite}.faq-error{padding:16px 18px;border:1px solid #fecaca;border-radius:10px;background:#fff1f2;color:#be123c}.faq-empty i{color:#198754;font-size:28px}.faq-empty h2{margin:14px 0 6px;color:#102a43;font-size:20px}.faq-empty p{margin:0}.faq-list{display:grid;gap:14px}.faq-list details{overflow:hidden;border:1px solid #dfe7ee;border-radius:14px;background:#fff;box-shadow:0 5px 18px rgba(16,42,67,.05);transition:border-color .2s ease,box-shadow .2s ease}.faq-list details[open]{border-color:#9bd2b3;box-shadow:0 10px 26px rgba(25,135,84,.1)}summary{display:flex;align-items:center;gap:14px;padding:19px 20px;cursor:pointer;list-style:none;color:#102a43;font-weight:700}summary::-webkit-details-marker{display:none}.faq-number{color:#198754;font-size:12px;font-weight:800}.faq-list summary>span:nth-child(2){flex:1}.faq-list summary i{color:#198754;font-size:12px;transition:transform .2s ease}.faq-list details[open] summary i{transform:rotate(45deg)}.faq-list details p{padding:0 20px 19px;line-height:1.7;color:#526579}@media (max-width:768px){.faq-page{padding:18px 16px 48px}.faq-heading{margin-top:18px;padding:34px 24px}.faq-heading h1{font-size:34px}.faq-filter{align-items:stretch;flex-direction:column;gap:9px}.faq-filter select{min-width:0;width:100%}.faq-list summary{padding:17px 16px}.faq-list details p{padding:0 16px 18px}}
		.faq-heading{margin-top:16px;padding:28px 36px}.faq-heading h1{margin:8px 0 6px;font-size:38px}.faq-heading p{font-size:14px}.faq-kicker{font-size:10px}
		@media(max-width:767px){.faq-heading{padding:24px 20px}.faq-heading h1{font-size:28px}.faq-heading p{font-size:13px}}
	`]
})
export class ProgramFaqsComponent implements OnInit {
	@Input() programId='';
	private http=inject(HttpClient);
	private route=inject(ActivatedRoute);
	faqs:any[]=[];selected='';error='';loading=true;
	get programs():any[]{const programs=new Map<string,any>();this.faqs.forEach(f=>{const program=this.programOf(f);if(program?._id)programs.set(program._id,program);});return [...programs.values()];}
	get visible(){return this.faqs.filter(f=>!this.selected||this.programOf(f)?._id===this.selected);}
	private programOf(faq:any):any{if(!faq?.programId)return null;return typeof faq.programId==='string'?{_id:faq.programId,programName:faq.programId}:faq.programId;}
	ngOnInit(){this.selected=this.programId||this.route.snapshot.queryParamMap.get('programId')||'';this.http.get<any>(environment.apiUrl+'/program-faqs').subscribe({next:r=>{const payload=Array.isArray(r)?r:r?.data;this.faqs=Array.isArray(payload)?payload:[];this.error=payload===undefined?'FAQ data format is unavailable.':'';this.loading=false;},error:()=>{this.error='Unable to load FAQs. Please try again later.';this.loading=false;}});}
}
