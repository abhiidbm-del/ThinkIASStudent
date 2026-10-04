import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';
@Component({selector:'app-public-footer',standalone:true,imports:[RouterLink,TranslatePipe],template:`
<footer><div class="columns"><section><h2>ThinkCivil IAS</h2><p>{{'Your journey to civil services starts here.' | t}}</p></section>
<nav aria-label="Footer navigation"><h3>{{'Quick Links' | t}}</h3><a routerLink="/homepage">{{'Home' | t}}</a><a routerLink="/homepage" fragment="guidence">{{'Objective' | t}}</a><a routerLink="/programs">{{'Programs' | t}}</a><a routerLink="/program-faqs">FAQs</a><a routerLink="/careers-page">{{'Careers' | t}}</a><a routerLink="/terms">Terms &amp; Conditions</a><a routerLink="/payment-policies">Payment Policies</a></nav>
<section><h3>{{'Contact Us' | t}}</h3><a href="tel:+918882744452">+91-88827 44452</a><a href="mailto:thinkcivil05@gmail.com">thinkcivil05&#64;gmail.com</a></section></div><p class="copyright">© {{year}} ThinkCivil IAS. {{'All rights reserved.' | t}}</p></footer>`,styles:[`
:host{display:block}footer{background:#152440;color:#fff;padding:40px 6% 20px}h2,h3{color:#fff;margin-top:0}.columns{display:grid;grid-template-columns:2fr 1fr 1fr;gap:32px}a{display:block;color:#e2e9f4;text-decoration:none;margin:10px 0;overflow-wrap:anywhere}a:hover{text-decoration:underline}.copyright{border-top:1px solid #ffffff30;margin-top:28px;padding-top:18px;font-size:13px}@media(max-width:650px){.columns{grid-template-columns:1fr;gap:18px}}
`]})
export class PublicFooterComponent {year=new Date().getFullYear();}
