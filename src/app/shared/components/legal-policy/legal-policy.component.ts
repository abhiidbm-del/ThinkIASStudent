import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface PolicySection {
  title: string;
  paragraphs: string[];
  points?: string[];
}

interface PolicyPage {
  title: string;
  introduction: string;
  sections: PolicySection[];
}

type PolicyKey = 'terms' | 'payments';

const POLICY_PAGES: Record<PolicyKey, PolicyPage> = {
  terms: {
    title: 'Terms & Conditions',
    introduction: 'These terms apply when you visit ThinkCivil IAS, create an account, or enrol in a program. Please review them before using our services.',
    sections: [
      {
        title: 'Using our services',
        paragraphs: [
          'By using this website or enrolling in a ThinkCivil IAS program, you agree to these terms. If you do not agree, please do not use the website or services.',
          'You must provide accurate registration and contact information and keep your account credentials secure. Activity carried out through your account is your responsibility.'
        ]
      },
      {
        title: 'Programs and enrolment',
        paragraphs: [
          'Program pages describe the available course, batch, duration, schedule, features, and fee. Review the details for your selected program and batch before enrolling. Availability and schedules may change; material updates will be communicated through the website or your registered contact details.',
          'Enrolment is confirmed after the applicable payment or coupon redemption has been successfully verified. Access is limited to the program and period shown at enrolment.'
        ]
      },
      {
        title: 'Educational services',
        paragraphs: [
          'Our courses, mentorship, tests, and study resources are educational support. Examination results depend on many factors outside our control; we do not guarantee selection, marks, or any particular examination outcome.'
        ]
      },
      {
        title: 'Study materials and acceptable use',
        paragraphs: [
          'Website content and course materials are provided for your personal study and may be protected by intellectual-property rights. Do not copy, record, publish, sell, or redistribute them without written permission.',
          'Do not misuse the website, interfere with its operation, attempt unauthorised access, share account access in a way that breaches your enrolment, or use the services unlawfully.'
        ]
      },
      {
        title: 'Changes and contact',
        paragraphs: [
          'We may update these terms when our services or applicable requirements change. The latest version will be published on this page. Continued use after an update means the updated terms apply to subsequent use.',
          'For questions about these terms, contact thinkcivil05@gmail.com or call +91 88827 44452.'
        ]
      }
    ]
  },
  payments: {
    title: 'Payment Policies',
    introduction: 'Review the fee and payment details for your chosen program or batch before completing checkout.',
    sections: [
      {
        title: 'Fees and offers',
        paragraphs: [
          'The amount shown for the selected program or batch at checkout is the amount due. Any discount or coupon is applied only when it is valid for that offering and is accepted at checkout. Please check the final amount before authorising payment.'
        ]
      },
      {
        title: 'Payment methods',
        paragraphs: [
          'Available options are shown during checkout and may include UPI, cards, net banking, wallets, or an eligible free coupon. Complete payment only through the checkout flow provided on this website. Never share your PIN, password, one-time passcode, or full card details by email or phone.'
        ]
      },
      {
        title: 'Confirmation and pending payments',
        paragraphs: [
          'Enrolment is confirmed after we receive successful payment confirmation. If money has been debited but your enrolment is not confirmed, avoid making the same payment again immediately. Contact support with your program or batch details and transaction reference so the payment can be checked.'
        ]
      },
      {
        title: 'Cancellations and refunds',
        paragraphs: [
          'Cancellation and refund eligibility can depend on the specific program or batch. Review any cancellation or refund terms shown with that offering or at checkout before paying. Requests are assessed against the terms applicable to that purchase and applicable law.',
          'If the applicable terms are unclear, contact us before completing payment. For a payment-status or refund query, include the transaction reference; do not send payment passwords, PINs, or one-time passcodes.'
        ]
      },
      {
        title: 'Payment support',
        paragraphs: [
          'For payment questions, contact thinkcivil05@gmail.com or call +91 88827 44452. Include the registered phone or email and transaction reference to help us locate the payment.'
        ]
      }
    ]
  }
};

@Component({
  selector: 'app-legal-policy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="legal-page">
      <article class="legal-document">
        <header class="legal-heading">
          <p class="legal-eyebrow">POLICIES</p>
          <h1>{{ page.title }}</h1>
          <p>{{ page.introduction }}</p>
        </header>
        <div class="legal-sections">
          <section *ngFor="let section of page.sections; let index = index">
            <h2><span>{{ (index + 1).toString().padStart(2, '0') }}</span>{{ section.title }}</h2>
            <p *ngFor="let paragraph of section.paragraphs">{{ paragraph }}</p>
            <ul *ngIf="section.points?.length">
              <li *ngFor="let point of section.points">{{ point }}</li>
            </ul>
          </section>
        </div>
        <p class="legal-contact">Questions? <a href="mailto:thinkcivil05@gmail.com">thinkcivil05&#64;gmail.com</a> · <a href="tel:+918882744452">+91 88827 44452</a></p>
      </article>
    </main>
  `,
  styles: [`
    :host{display:block;background:#f4f7fa;color:#24364b}
    .legal-page{max-width:1040px;min-height:60vh;margin:0 auto;padding:40px 28px 64px}
    .legal-document{max-width:840px;margin:0 auto;padding:36px 44px;background:#fff;border:1px solid #e0e8ee;border-top:3px solid #198754;border-radius:8px;box-shadow:0 8px 24px rgba(16,42,67,.05)}
    .legal-heading{padding:0 0 26px;border-bottom:1px solid #d9e2e9}
    .legal-eyebrow{margin:0 0 10px;color:#198754;font-size:11px;font-weight:800;letter-spacing:.12em}
    h1{margin:0 0 12px;color:#102a43;font-size:36px;line-height:1.2}
    .legal-heading>p:last-child{max-width:700px;margin:0;color:#526579;font-size:16px;line-height:1.65}
    .legal-sections section{padding:24px 0;border-bottom:1px solid #d9e2e9}
    h2{display:flex;gap:12px;align-items:baseline;margin:0 0 12px;color:#102a43;font-size:20px;line-height:1.4}
    h2 span{color:#198754;font-size:12px;font-variant-numeric:tabular-nums}
    .legal-sections p,.legal-sections li{margin:0 0 10px;color:#43566b;font-size:15px;line-height:1.75}
    .legal-sections p:last-child{margin-bottom:0}
    .legal-sections ul{padding-left:22px}
    .legal-contact{margin:20px 0 0;padding-top:18px;border-top:1px solid #d9e2e9;color:#526579;font-size:14px;line-height:1.7}
    .legal-contact a{color:#17683f;font-weight:600}
    .legal-contact a:focus-visible{outline:2px solid #198754;outline-offset:3px}
    @media(max-width:600px){.legal-page{padding:24px 12px 40px}.legal-document{padding:24px 20px}.legal-heading{padding-bottom:22px}h1{font-size:30px}h2{font-size:18px}.legal-sections section{padding:20px 0}}
  `]
})
export class LegalPolicyComponent {
  readonly page: PolicyPage;

  constructor() {
    const policy = inject(ActivatedRoute).snapshot.data['policy'] as PolicyKey;
    this.page = POLICY_PAGES[policy] ?? POLICY_PAGES.terms;
  }
}