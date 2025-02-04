import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  // Replace with your Gemini API endpoint
  private geminiApiUrl = 'https://api.gemini.com/analyze'; 

  constructor(private http: HttpClient) {}

  // Method to send data to Gemini for analysis
  analyzeData(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'AIzaSyB02haLReTYIP13UjQ8IG1874NAzm7RS_k' // Replace with your Gemini API key
    });

    return this.http.post<any>(this.geminiApiUrl, data, { headers });
  }
}
