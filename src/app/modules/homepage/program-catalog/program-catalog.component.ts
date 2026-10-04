import {Component,OnInit,inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {environment} from '../../../../environment/environment';
import {TranslatePipe} from '../../../shared/i18n/translate.pipe';
@Component({
	standalone:true,
	imports:[CommonModule,FormsModule,RouterLink,TranslatePipe],
	template:`
		<main class="catalog-page">
			<nav class="catalog-nav"><a routerLink="/homepage"><i class="fas fa-arrow-left"></i> ThinkCivil IAS</a><span>{{ category || 'All programs' }}</span></nav>
			<header class="catalog-hero">
				<div class="hero-copy">
					<span class="eyebrow">{{ category ? 'CURATED LEARNING' : 'THINKCIVIL IAS PROGRAMS' }}</span>
					<h1>{{ category || 'Find the right program for your next attempt' }}</h1>
					<p>Explore focused preparation programs, compare what fits your goals, and move forward with clarity.</p>
				</div>
				<div class="hero-mark"><i class="fas fa-compass"></i></div>
			</header>

			<section class="catalog-toolbar" aria-label="Program filters">
				<label><span>Category</span><select [(ngModel)]="category"><option value="">All programs</option><option *ngFor="let c of categories" [value]="c">{{c}}</option></select></label>
				<label><span>Year</span><select [(ngModel)]="year"><option value="">All years</option><option *ngFor="let y of years" [value]="y">{{y}}</option></select></label>
				<label class="search-field"><span>Search programs</span><i class="fas fa-search"></i><input [(ngModel)]="search" placeholder="Find a program"></label>
				<strong class="result-count">{{ visible.length }} {{ visible.length === 1 ? 'program' : 'programs' }}</strong>
			</section>

			<p class="catalog-error" role="alert" *ngIf="error">{{error}}</p>
			<div class="catalog-state" *ngIf="loading"><span class="catalog-spinner"></span>Loading programs...</div>
			<div class="catalog-state" *ngIf="!loading && !error && !visible.length"><i class="fas fa-search"></i><h2>No programs found</h2><p>Try another category or search term.</p></div>

			<section class="program-grid" *ngIf="!loading && visible.length">
				<article class="program-card" *ngFor="let p of visible">
					<div class="program-image"><img [src]="p.displayImage" [alt]="p.programName"><span>{{p.programCategory}}</span></div>
					<div class="program-body">
						<div class="program-meta"><span><i class="fas fa-calendar"></i> {{p.year}}</span><span *ngIf="p.duration"><i class="fas fa-clock"></i> {{p.duration | t:p.durationHindi}}</span></div>
						<h2>{{p.programName | t:p.programNameHindi}}</h2>
						<p class="program-description">{{p.description | t:p.descriptionHindi}}</p>
						<ul class="feature-list" *ngIf="p.features?.length"><li *ngFor="let feature of p.features | slice:0:3;let i=index"><i class="fas fa-check"></i>{{featureText(feature) | t:featureHindi(p,i)}}</li></ul>
						<div class="program-footer"><strong>{{(p.discountedPrice ?? p.price) | currency:'INR'}}</strong><span *ngIf="p.startDate">Starts {{p.startDate | date:'mediumDate'}}</span></div>
						<div class="program-actions"><a class="primary-action" [routerLink]="['/program',p._id]">View batches <i class="fas fa-arrow-right"></i></a><a class="secondary-action" routerLink="/program-faqs" [queryParams]="{programId:p._id}">FAQs</a></div>
					</div>
				</article>
			</section>
		</main>
	`,
	styles:[`
		:host{display:block;background:#f6f8fb;min-height:100vh}.catalog-page{max-width:1240px;margin:0 auto;padding:24px 28px 72px}.catalog-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;font-size:13px}.catalog-nav a{display:inline-flex;align-items:center;gap:9px;color:#17683f;text-decoration:none;font-weight:700}.catalog-nav a i{font-size:11px}.catalog-nav span{color:#64748b}.catalog-hero{display:flex;justify-content:space-between;align-items:center;min-height:260px;padding:42px 48px;border-radius:22px;background:linear-gradient(120deg,#102a43 0%,#1d5374 62%,#198754 100%);color:#fff;box-shadow:0 18px 40px rgba(16,42,67,.18)}.hero-copy{max-width:760px}.eyebrow{color:#b5e5c7;font-size:11px;font-weight:800;letter-spacing:.15em}.catalog-hero h1{margin:14px 0 12px;font-size:clamp(32px,5vw,58px);line-height:1.05;letter-spacing:-.03em}.catalog-hero p{max-width:630px;margin:0;color:#d7e7ed;font-size:16px;line-height:1.65}.hero-mark{display:grid;place-items:center;width:104px;height:104px;border:1px solid rgba(255,255,255,.3);border-radius:50%;color:#d8f2e1;font-size:44px;transform:rotate(-12deg)}.catalog-toolbar{display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;margin:28px 0;padding:18px 20px;border:1px solid #e0e8ee;border-radius:14px;background:#fff;box-shadow:0 6px 20px rgba(16,42,67,.05)}.catalog-toolbar label{display:flex;flex-direction:column;gap:7px;color:#334155;font-size:12px;font-weight:800}.catalog-toolbar select,.catalog-toolbar input{min-width:155px;padding:10px 12px;border:1px solid #d6e0e8;border-radius:8px;background:#fff;color:#102a43;font:inherit;font-weight:500}.search-field{position:relative}.search-field i{position:absolute;bottom:12px;left:12px;color:#198754;font-size:12px}.search-field input{padding-left:32px;min-width:220px}.result-count{margin-left:auto;padding-bottom:10px;color:#198754;font-size:13px}.program-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}@media (max-width:991px){.program-grid{grid-template-columns:repeat(2,1fr)}}@media (max-width:576px){.program-grid{grid-template-columns:1fr}}.program-card{overflow:hidden;border:1px solid #e1e8ed;border-radius:16px;background:#fff;box-shadow:0 8px 24px rgba(16,42,67,.07);transition:transform .25s ease,box-shadow .25s ease}.program-card:hover{transform:translateY(-8px);box-shadow:0 20px 40px rgba(16,42,67,.16)}.program-image img{transition:transform .35s ease}.program-card:hover .program-image img{transform:scale(1.06)}.program-card:hover{transform:translateY(-6px);box-shadow:0 16px 32px rgba(16,42,67,.13)}.program-image{position:relative;height:188px;background:#dbe8eb}.program-image img{width:100%;height:100%;object-fit:cover}.program-image:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(16,42,67,.58))}.program-image span{position:absolute;z-index:1;bottom:14px;left:16px;padding:6px 10px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(16,42,67,.7);color:#fff;font-size:11px;font-weight:700}.program-body{padding:20px}.program-meta{display:flex;gap:14px;margin-bottom:12px;color:#64748b;font-size:11px;font-weight:700}.program-meta i{color:#198754}.program-body h2{margin:0 0 9px;color:#102a43;font-size:21px;line-height:1.2}.program-description{display:-webkit-box;overflow:hidden;min-height:48px;margin:0 0 15px;color:#64748b;font-size:13px;line-height:1.6;-webkit-box-orient:vertical;-webkit-line-clamp:2}.feature-list{display:grid;gap:7px;margin:0 0 18px;padding:0;list-style:none;color:#385247;font-size:12px}.feature-list li{display:flex;gap:8px;align-items:flex-start}.feature-list i{margin-top:3px;color:#198754;font-size:10px}.program-footer{display:flex;justify-content:space-between;align-items:baseline;padding-top:15px;border-top:1px solid #edf1f3}.program-footer strong{color:#198754;font-size:22px}.program-footer span{color:#94a3b8;font-size:11px}.program-actions{display:flex;align-items:center;gap:12px;margin-top:18px}.primary-action,.secondary-action{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:10px 14px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;transition:transform .2s ease,box-shadow .2s ease,background-color .2s ease}.primary-action{flex:1;background:#198754;color:#fff}.primary-action:hover{background:#146c43;box-shadow:0 7px 15px rgba(25,135,84,.22);transform:translateY(-1px)}.secondary-action{border:1px solid #cfe0d6;color:#17683f;background:#f5fbf7}.secondary-action:hover{background:#e1f3e8}.catalog-state{padding:48px;text-align:center;color:#64748b;border:1px solid #e1e8ed;border-radius:14px;background:#fff}.catalog-state i{color:#198754;font-size:26px}.catalog-state h2{margin:12px 0 6px;color:#102a43;font-size:20px}.catalog-state p{margin:0}.catalog-spinner{display:inline-block;width:18px;height:18px;margin-right:8px;border:3px solid #d8eee1;border-top-color:#198754;border-radius:50%;vertical-align:-4px;animation:catalog-spin .8s linear infinite}.catalog-error{padding:14px 16px;border:1px solid #fecaca;border-radius:9px;background:#fff1f2;color:#be123c}@keyframes catalog-spin{to{transform:rotate(360deg)}}@media(max-width:640px){.catalog-page{padding:18px 16px 48px}.catalog-hero{min-height:0;padding:32px 25px}.hero-mark{display:none}.catalog-toolbar{align-items:stretch;flex-direction:column}.catalog-toolbar select,.catalog-toolbar input,.search-field input{width:100%;min-width:0}.result-count{margin:0;padding:0}.program-grid{grid-template-columns:1fr}}
	`]
})
export class ProgramCatalogComponent implements OnInit {
	private http=inject(HttpClient); private route=inject(ActivatedRoute);
	programs:any[]=[]; category=''; year=''; search=''; error=''; loading=true;
	categories=['Mentorship Course','Optional Mentorship Course','Test Series','Optional Test Series','Essay','Prelims Program','Mains Program','Interview Program'];
	get years(){return [...new Set(this.programs.map(p=>p.year))].sort().reverse();}
	get visible(){const query=this.search.toLowerCase();return this.programs.filter(p=>(!this.category||p.programCategory===this.category)&&(!this.year||p.year===this.year)&&[p.programName,p.programNameHindi,p.description].join(' ').toLowerCase().includes(query));}
	featureText(feature:unknown):string{return String(feature ?? '');}
	featureHindi(program:any,index:number):string|undefined{return program?.featuresHindi?.[index] as string|undefined;}
	ngOnInit(){this.route.queryParamMap.subscribe(q=>this.category=q.get('category')||'');this.http.get<any>(environment.apiUrl+'/programs?activeOnly=true').subscribe({next:r=>{this.programs=Array.isArray(r)?r:(r?.data||[]);this.loading=false;},error:()=>{this.error='Unable to load programs.';this.loading=false;}});}
}
