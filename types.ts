export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Reminder {
  plantName: string;
  interval: number; // in days
  startDate: number; // timestamp
}
