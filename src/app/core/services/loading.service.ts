import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Global Loading & Error Handling Service
 * Centralizes loading states and error messages for better UX
 * Based on DUANA Frontend best practices
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  public error$: Observable<string | null> = this.errorSubject.asObservable();
  
  /**
   * Show global loading spinner
   * @param message Optional loading message
   */
  showLoading(message?: string): void {
    this.loadingSubject.next(true);
    if (message) {
      console.log(`[Loading] ${message}`);
    }
  }
  
  /**
   * Hide global loading spinner
   */
  hideLoading(): void {
    this.loadingSubject.next(false);
  }
  
  /**
   * Set error message
   * @param error Error message or Error object
   */
  setError(error: string | Error): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    this.errorSubject.next(errorMessage);
    console.error(`[Error] ${errorMessage}`);
  }
  
  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSubject.next(null);
  }
  
  /**
   * Get current loading state
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }
  
  /**
   * Get current error
   */
  getCurrentError(): string | null {
    return this.errorSubject.value;
  }
}
