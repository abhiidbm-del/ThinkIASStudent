import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';
@Pipe({name: 't', standalone: true, pure: false})
export class TranslatePipe implements PipeTransform {
  private language = inject(LanguageService);
  transform(english: string | null | undefined, hindi?: string | null): string { return this.language.content(english, hindi); }
}
