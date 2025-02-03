import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  videos: any[] = []; // Use this consistently instead of `videoss`
  currentIndex = 0;
  isTriviaMode = false;
  isLoading: boolean = false;
  triviaQuestion: string = '';
  triviaOptions: string[] = [];
  correctAnswer: string | null = null;

  triviaQuestions: any[] = []; // Store all trivia questions
  currentTriviaIndex = 0; // Track the current trivia question being displayed
  selectedAnswer: string | null = null; // Track the user's selected answer
  isAnswerCorrect: boolean | null = null; // Track if the answer is correct
  currentTriviaQuestion: any = null; // Store the current question

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchVideos();
  }

  fetchVideos() {
    this.http.get<any[]>('http://localhost:3000/api/videos').subscribe({
      next: (data) => {
        this.videos = data.map(video => ({
          title: `${video.homeTeam} vs ${video.awayTeam} (${video.gameDate})`,
          url: video.videoUrl, // Assuming `videoUrl` is the URL of the video
          gamepk: video.gamePk
        }));
        this.logCurrentGamePk();
      },
      error: (error) => {
        console.error('Error fetching videos:', error);
      }
    });
  }

  logCurrentGamePk() {
    if (this.videos.length > 0) {
      //console.log('Current gamepk:', this.videos[this.currentIndex].gamepk);
    }
  }

  nextVideo() {
    if (this.currentIndex < this.videos.length - 1) {
      this.currentIndex++;
      this.logCurrentGamePk();
    }
  }

  previousVideo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.logCurrentGamePk();
    }
  }

  moveLeft() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.logCurrentGamePk();
    }
  }

  moveRight() {
    if (this.currentIndex < this.videos.length - 1) {
      this.currentIndex++;
      this.logCurrentGamePk();
    }
  }

  closeTriviaMode() {
    this.isTriviaMode = false;
    this.resetTriviaState();
  }

  resetTriviaState() {
    this.triviaQuestion = '';
    this.triviaOptions = [];
    this.selectedAnswer = null;
    this.correctAnswer = null;
    this.isAnswerCorrect = null;
    this.triviaQuestions = [];
    this.currentTriviaIndex = 0;
    this.currentTriviaQuestion = null;
  }

  enterTriviaMode() {
    this.isLoading = true; // Show loading spinner
    this.isTriviaMode = true;
  
    const currentGamePk = this.videos[this.currentIndex].gamepk;
    //console.log('Entering trivia mode for gamePk:', currentGamePk);
  
    // Send gamepk to the backend to get trivia data
    this.http.post<any>('http://localhost:3000/api/trivia', { gamepk: currentGamePk }).subscribe({
      next: (response) => {
        if (response.success) {
          this.triviaQuestions = response.triviaQuestions; // Extract triviaQuestions from the response
          this.loadTriviaQuestion(0); // Load the first question
          this.isLoading = false; // Show loading spinner

          //console.log('Trivia Questions Loaded:', this.triviaQuestions);
        } else {
          console.error('Failed to load trivia questions:', response);
        }
      },
      error: (error) => {
        console.error('Error fetching trivia:', error);
      }
    });
  }

  loadTriviaQuestion(index: number) {
    if (index >= 0 && index < this.triviaQuestions.length) {
      this.currentTriviaIndex = index;
      this.currentTriviaQuestion = this.triviaQuestions[index];
      this.triviaQuestion = this.currentTriviaQuestion.triviaQuestion;
      this.triviaOptions = this.currentTriviaQuestion.options;
      this.correctAnswer = this.currentTriviaQuestion.correctAnswer;
      this.selectedAnswer = null; // Reset selected answer
      this.isAnswerCorrect = null; // Reset answer correctness
    } else {
      console.error('Invalid trivia question index:', index);
    }
  }

  selectAnswer(option: string) {
    this.selectedAnswer = option;
    this.isAnswerCorrect = option === this.correctAnswer;
    //console.log('Selected Answer:', this.selectedAnswer);
    //console.log('Is Answer Correct?', this.isAnswerCorrect);
  }

nextTriviaQuestion() {
  if (this.currentTriviaIndex < this.triviaQuestions.length - 1) {
    this.currentTriviaIndex++;
    this.loadTriviaQuestion(this.currentTriviaIndex);
  }
}

previousTriviaQuestion() {
  if (this.currentTriviaIndex > 0) {
    this.currentTriviaIndex--;
    this.loadTriviaQuestion(this.currentTriviaIndex);
  }
}
}